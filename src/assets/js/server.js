import u from './utils.js'

window.addEventListener('load',()=>{
    const room=u.getQString( location.href,'room' );
    const username=sessionStorage.getItem('username');
    console.log("i m in load rtc")
    if(!room)
    {
        console.log("i m in !room rtc")

        document.querySelector('#room-create').attributes.removeNamedItem('hidden')
    }
    else if (!username)
    {
        console.log("i m in !user rtc")

        document.querySelector('#username-set').attributes.removeNamedItem('hidden')
    }
    else 
    {
        console.log("Else wala bhag")

        let comEle=document.getElementsByClassName('room-comm')
        for(let i=0;i<comEle.length;i++)
        {
            comEle[i].attributes.removeNamedItem('hidden');
        }
        var pc=[];
        let socket = io('/stream');

        let socketId='';
        let myStream='';
        let screen='';
        let recStream=[];
        let mediaRec='';

        //getting user's video by default
        getUserStream();

        
        socket.on('connect',()=>{
            console.log("in socket")
            socketId=socket.io.engine.id
            
            socket.emit('subscribe',{
                room:room,
                socketId:socketId
            })
            
            socket.on('new user',(data)=>{
                console.log("new User rtc")
                socket.emit('newUserStart',{to:data.socketId, sender : socketId  })
                pc.push(data.socketId)
                init(true,data.socketId);
            })
            
            socket.on('newUserStart',(data)=>{
                console.log("new User Start rtc")
                pc.push(data.sender);
                init(false,data.sender)
                
            })
            
            
            socket.on('ice candidates',async(data)=>{
                console.log("ice rtc")
                data.candidate ? await pc[data.sender].addIceCandidate(new RTCIceCandidate(data.candidate)) : ''
            })
            
            
            socket.on('sdp',async (data)=>{
                console.log("in sdp rtc")
                if(data.description.type==='offer')
                {
                    data.description ?await pc[data.sender].setRemoteDescription(new RTCSessionDescription(data.description)):'';
                    
                    u.getUserFullMedia().then(async(stream)=>{
                        if(!document.getElementById('local').srcObject)
                        {
                            u.setLocalStream(stream)
                        }
                        
                        myStream=stream;
                        stream.getTracks().forEach((track)=>{
                            pc[data.sender].addTrack(track,stream)
                        })
                        
                        let answer=await pc[data.sender].createAnswer();
                        await pc[data.sender].setLocalDescription(answer);
                        socket.emit('sdp',{ description : pc[data.sender].localDescription, to : data.sender ,sender: socketId})
                        
                    }).catch((e)=>{
                        console.error(e);
                    })
                }
                
                else if(data.description.type==='answer')
                {
                    await pc[data.sender].setRemoteDescription( new RTCSessionDescription(data.description))
                }
            })

            socket.on('chat',(data)=>{
                console.log("sending remote chat")
                u.addChat(data,'remote')
            })
            
        })
        

        function getUserStream() {
            console.log("getting user vid")
            u.getUserFullMedia().then((stream)=>{
                //saving our stream
                myStream= stream

                u.setLocalStream(stream)
            }).catch((e)=>{
                console.log(`Error : cannot set stream : ${e}`)
            })
        }
        
        function init(createOffer,partnerName)
        {
            console.log("init")
            pc[partnerName]=new RTCPeerConnection(u.getIceServer()); //get ice server uses stunn and turn servers to make a connection
            
            if(screen && screen.getTracks().length)
            {
                screen.getTracks().forEach((track)=>{
                    pc[partnerName].addTrack(track,screen); //should trigger negotiationneeded event
                })
            }
            else if(myStream)
            {
                myStream.getTracks().forEach((track)=>{
                    pc[partnerName].addTrack(track,myStream) //should trigger negotiationneeded event
                })
            }
            else
            {
                u.getUserFullMedia().then((stream)=>{
                    myStream=stream

                    stream.getTracks().forEach((track)=>{
                        pc[partnerName].addTrack(track,stream) //should trigger negotiationneeded event

                    })
                    u.setLocalStream(stream)
                }).catch((e)=>{
                    console.log(`Stream Error : ${e}`)
                })
            }
            
            //creating offer
            if(createOffer)
            {
                pc[partnerName].onnegotiationneeded = async()=>{
                    console.log("Creating Offer")

                    let offer=await pc[partnerName].createOffer();
                    console.log(offer)
                    await pc[partnerName].setLocalDescription(offer);
                    socket.emit( 'sdp', { description: pc[partnerName].localDescription, to: partnerName, sender: socketId } );
                }
            }

            //sending ICE Candidates to partner Names
            pc[partnerName].onicecandidate=({candidate})=>{
                console.log("sending ICE candidates to partner Names")

                socket.emit('ice candidates',{candidate : candidate, to : partnerName, sender: socketId})
            }

            //add
            pc[partnerName].ontrack=(e)=>{
                console.log("Add Ontrack")
                let curStream=e.streams[0];
                if(document.getElementById(`${partnerName}-video`))
                {
                    document.getElementById(`${partnerName}-video`).srcObject=curStream;
                }
                else
                {
                    //video elements
                    let newVid=document.createElement('video');
                    newVid.id=`${partnerName}-video`
                    newVid.srcObject=curStream
                    newVid.autoplay=true;
                    newVid.className='remote-video'


                    //video controls elements
                    let controlDiv=document.createElement('div')
                    controlDiv.className='remote-video-controls'
                    controlDiv.innerHTML=`<i class="fa fa-microphone text-white pr-3 mute-remote-mic" title="Mute"></i>
                    <i class="fa fa-expand text-white expand-remote-video" title="Expand"></i>`

                    //creating a new div for card
                    let cardDiv=document.createElement('div')
                    cardDiv.className='card card-sm'
                    cardDiv.id=partnerName
                    cardDiv.appendChild(newVid)
                    cardDiv.appendChild(controlDiv)

                    //put div in main-section elem
                    document.getElementById('videos').appendChild(cardDiv)

                    u.adjustVideoElemSize();

                }
            }
            
            pc[partnerName].onconnectionstatechange =(d)=>{
                switch(pc[partnerName].iceConnectionState){
                    case 'disconnected' :
                    case 'failed' :
                        u.closeVideo(partnerName);
                        break;
                    case 'closed':
                        u.closeVideo(partnerName);
                        break;
                }
            }

            pc[partnerName].onsignalingstatechange=(d)=>{
                switch( pc[partnerName].signalingState)
                {
                    case 'closed' :
                        console.log("Signaling State is Closed");
                        u.closeVideo(partnerName);
                        break;
                }
            }
        }

        function sendMessage(msg)
        {
            let val={room : room , msg : msg , sender : username};

            socket.emit('chat',val)
            console.log("emitting chat val")
            u.addChat(val,'local')
        }

        function Broadcast(stream, type, mirrorMode=true)
        {
            u.setLocalStream(stream,mirrorMode)

            let curTrack=type=='audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

            for(let x in pc)
            {
                let xName=pc[x];

                if(typeof pc[xName]=='object')
                {
                    u.replaceTrack(curTrack,pc[xName])
                }
            }
        }

        function screenShare()
        {
            u.shareScreen().then((stream)=>{
                u.toggleShareIcons(true);
                u.toggleVideoBtnDisable(true); //disable sharescreen btn while screen is sharing
                screen=stream;

                Broadcast(stream,'video',false)
                screen.getVideoTracks()[0].addEventListener('ended',()=>{
                    stopScreenShare();
                })
            }).catch((e)=>{
                console.log(e)
            })
        }

        function stopScreenShare()
        {
            u.toggleVideoBtnDisable(false);
            return new Promise((res,req)=>{
                screen.getTracks().length ? screen.getTracks().forEach(track=>track.stop()): '';
                res();

            }).then(()=>{
                u.toggleShareIcons(false);
                Broadcast(myStream,'video')
            }).catch((e)=>{
                console.log(e)
            })
        }

        function toggleRecIcons( isRecording)
        {
            let e = document.getElementById( 'record' );

            if ( isRecording ) {
                e.setAttribute( 'title', 'Stop recording' );
                e.children[0].classList.add( 'text-danger' );
                e.children[0].classList.remove( 'text-white' );
            }

            else {
                e.setAttribute( 'title', 'Record' );
                e.children[0].classList.add( 'text-white' );
                e.children[0].classList.remove( 'text-danger' );
            }
        }

        function startRecording(stream)
        {
            console.log("in func start rec ")
            mediaRec=new MediaRecorder(stream,{
                mimeType : 'video/webm;codecs=vp9'
            })
            mediaRec.start(1000);
            toggleRecIcons(true)

            mediaRec.ondataavailable=function(e){
                recStream.push(e.data)
            }
            mediaRec.onstop= function()
            {
                console.log("onStop func rtc")      
                toggleRecIcons(false)
                u.saveRecordedStream(recStream,username)

                setTimeout(() => {
                    recStream=[]
                }, 3000);
            }
            mediaRec.onerror=function(e){
                console.error(e);
            }
        }





        document.getElementById('chat-input').addEventListener('keypress',(e)=>{
            var code=e.which || e.keyCode;
            if(code==13 && (e.target.value.trim()) )  // means enter key is pressed
            {
                sendMessage(e.target.value);

                setTimeout(()=>{
                    e.target.value=''
                },50)
            }
        })

        //Video hide/Unhide
        document.getElementById('toggle-video').addEventListener('click',(e)=>{
            e.preventDefault();

            let ele=document.getElementById('toggle-video')

            if(myStream.getVideoTracks()[0].enabled)
            {
                e.target.classList.remove('fa-video');
                e.target.classList.add('fa-video-slash')
                ele.setAttribute('title','Show Video')

                myStream.getVideoTracks()[0].enabled=false;
            }
            else
            {
                e.target.classList.remove('fa-video-slash')
                e.target.classList.add('fa-video')
                ele.setAttribute('title','Hide Video');

                myStream.getVideoTracks()[0].enabled=true;
            }
            Broadcast(myStream,'video')
        })

        //Mute/Unmute
        document.getElementById('toggle-mute').addEventListener('click',(e)=>{
            e.preventDefault();
            let ele=document.getElementById('toggle-mute')

            if(myStream.getAudioTracks()[0].enabled)
            {
                e.target.classList.remove('fa-microphone-alt');
                e.target.classList.add('fa-microphone-alt-slash')
                ele.setAttribute('title','Unmute')
                myStream.getAudioTracks()[0].enabled=false
            }
            else
            {
                e.target.classList.remove('fa-microphone-alt-slash')
                e.target.classList.add('fa-microphone-alt')
                ele.setAttribute('title','Mute')

                myStream.getAudioTracks()[0].enabled=true
            }
            Broadcast(myStream,'audio')
        })

        //sharing Screen

        document.getElementById('share-screen').addEventListener('click',(e)=>{
            e.preventDefault();
            if(screen && screen.getVideoTracks().length&& screen.getVideoTracks()[0].readyState!='ended')
            {
                stopScreenShare()
            }
            else {
                screenShare()
            }
        })


        document.getElementById('record').addEventListener('click',(e)=>{
            console.log("in rec rtc")
            if(!mediaRec || mediaRec.state=='inactive')
            {
                console.log("in !mediaRec")
                u.toggleModal('recording-options-modal',true)
            }
            else if(mediaRec.state=='paused')
            {
                mediaRec.resume();
            }
            else if(mediaRec.state=='recording')
            {
                console.log("stopping")
                mediaRec.stop();
                console.log("stopped")
            }
        })

        document.getElementById('record-screen').addEventListener('click',()=>{
            u.toggleModal('recording-options-modal',false)

            if(screen && screen.getVideoTracks().length)
            {
                startRecording(screen)
            }
            else
            {
                u.shareScreen().then((screenStream)=>{
                    startRecording(screenStream);
                }).catch(()=>{});
            }
        })

        document.getElementById('record-video').addEventListener('click',()=>{
            u.toggleModal('recording-options-modal',false)
            console.log("in rec video")

            if(myStream && myStream.getTracks().length)
            {
                console.log("in rec Startvideo")
                startRecording(myStream)
            }
            else
            {
                u.getUserFullMedia().then((videoStream)=>{
                    startRecording(videoStream)
                }).catch(()=>{});
            }
        })







    }
})