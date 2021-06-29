export default{
    generateRandomString()
    {
        const crypto=window.crypto || window.msCrypto;
        let array=new Uint32Array(1);
        return crypto.getRandomValues(array);
    },


    getQString(url='',keyToReturn='')
    {
        url=url?url:location.href;
        let queryStrings=decodeURIComponent(url).split('#',2)[0].split('?',2)[1];
        
        if(queryStrings)
        {
            let splittedQStrings=queryStrings.split('&');
            if(splittedQStrings.length>0)
            {
                let queryStringObj={};
                splittedQStrings.forEach( function(keyValuePair){
                    let keyValue=keyValuePair.split('=',2)
                    if(keyValue.length)
                    {
                        queryStringObj[keyValue[0]]=keyValue[1];
                    }
                } )
                return keyToReturn ? ( queryStringObj[keyToReturn]?queryStringObj[keyToReturn] : null ) : queryStringObj
            }
            return null
        }
        return null
    },

    userMediaAvailable()
    {
        return !!( navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia   )
    },

    getUserFullMedia(){
        if(this.userMediaAvailable())
        {
            return navigator.mediaDevices.getUserMedia({
                video : true,
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                }
            })
        }
        else
        {
            throw new Error ('User Media not available')
        }
    },

    getIceServer()
    {
        return {
            iceServers: [
                {
                    urls: ["stun:eu-turn4.xirsys.com"]
                },
                {
                    username: "ml0jh0qMKZKd9P_9C0UIBY2G0nSQMCFBUXGlk6IXDJf8G2uiCymg9WwbEJTMwVeiAAAAAF2__hNSaW5vbGVl",
                    credential: "4dd454a6-feee-11e9-b185-6adcafebbb45",
                    urls: [
                        "turn:eu-turn4.xirsys.com:80?transport=udp",
                        "turn:eu-turn4.xirsys.com:3478?transport=tcp"
                    ]
                }
            ]
        };
    },

    setLocalStream(stream, mirrorMode=true)
    {
        console.log("setting local stream")

        const localvid=document.getElementById('local');
        //console.log(localvid)
        localvid.srcObject=stream;
        mirrorMode? localvid.classList.add('mirror-mode') : localvid.classList.remove('mirror-mode');
    },

    adjustVideoElemSize() {
        let elem = document.getElementsByClassName( 'card' );
        let totalRemoteVideosDesktop = elem.length;
        let newWidth = totalRemoteVideosDesktop <= 2 ? '43%' : (
            totalRemoteVideosDesktop == 3 ? '33.33%' : (
                totalRemoteVideosDesktop <= 8 ? '25%' : (
                    totalRemoteVideosDesktop <= 15 ? '20%' : (
                        totalRemoteVideosDesktop <= 18 ? '16%' : (
                            totalRemoteVideosDesktop <= 23 ? '15%' : (
                                totalRemoteVideosDesktop <= 32 ? '12%' : '10%'
                            )
                        )
                    )
                )
            )
        );


        for ( let i = 0; i < totalRemoteVideosDesktop; i++ ) {
            elem[i].style.width = newWidth;
        }
    },

    closeVideo(elem)
    {
        if(document.getElementById(elem))
        {
            document.getElementById(elem).remove();
            this.adjustVideoElemSize();
        }
    },
    pageHasFocus()
    {
        return !(document.hidden || document.onfocusout || window.onpagehide || window.onblur)
    },

    addChat ( data, senderType)
    {
        let chatMsgDiv = document.querySelector('#chat-messages')
        let contentAlign='justify-content-end'
        let senderName='you'
        let msgBackGround='bg-white'
        console.log("in remote chat util")
        if(senderType==='remote')
        {
            contentAlign='justify-content-start'
            senderName=data.sender
            msgBackGround='';
            this.toggleChatNotiBadge();
        }


        let infoDiv= document.createElement('div')
        infoDiv.className='sender-info'
        infoDiv.innerHTML=`${senderName}-${moment().format('Do MMMM, YYYY h:mm a')} `

        let colDiv = document.createElement( 'div' );
        colDiv.className = `col-10 card chat-card msg ${ msgBackGround }`;
        colDiv.innerHTML = xssFilters.inHTMLData( data.msg ).autoLink( { target: "_blank", rel: "nofollow"});

        let rowDiv = document.createElement( 'div' );
        rowDiv.className = `row ${ contentAlign } mb-2`;


        colDiv.appendChild( infoDiv );
        rowDiv.appendChild( colDiv );

        chatMsgDiv.appendChild( rowDiv );

        /**
         * Move focus to the newly added message but only if:
         * 1. Page has focus
         * 2. User has not moved scrollbar upward. This is to prevent moving the scroll position if user is reading previous messages.
         */
        if ( this.pageHasFocus ) {
            rowDiv.scrollIntoView();
    
        }
        
    },
    toggleChatNotiBadge()
    {
        if(document.querySelector('#chat-pane').classList.contains('chat-opened'))
        {
            document.querySelector('#new-chat-notification').setAttribute('hidden',true)

        }
        else
        {
            document.querySelector('#new-chat-notification').removeAttribute('hidden')
        }
    },

    replaceTrack(stream, recipientPeer)
    {
        let sender= recipientPeer.getSenders ? recipientPeer.getSenders().find(s=>s.track && s.track.kind === stream.kind) : false;

        sender ? sender.replaceTrack(stream): '';
    },

    shareScreen()
    {
        if(this.userMediaAvailable())
        {
            return navigator.mediaDevices.getDisplayMedia({
                video : {cursor: "always" },
                audio : { echoCancellation : true, noiseSuppression : true, sampleRate : 44100 }
            })
        }
        else
        {
            throw new Error('User Media Not Available')
        }
    },

    toggleShareIcons( share ) {
        let shareIconElem = document.querySelector( '#share-screen' );

        if ( share ) {
            shareIconElem.setAttribute( 'title', 'Stop sharing screen' );
            shareIconElem.children[0].classList.add( 'text-primary' );
            shareIconElem.children[0].classList.remove( 'text-white' );
        }

        else {
            shareIconElem.setAttribute( 'title', 'Share screen' );
            shareIconElem.children[0].classList.add( 'text-white' );
            shareIconElem.children[0].classList.remove( 'text-primary' );
        }
    },
    
    toggleVideoBtnDisable( isdisabled ) {
        document.getElementById( 'toggle-video' ).disabled = isdisabled;
    },

    toggleModal(id,show)
    {
        console.log("in Toggle model utils")
        let ele=document.getElementById(id);
        //console.log(ele)
        if(show)
        {
            ele.style.display='block'
            ele.removeAttribute('hidden')
            console.log("in show utils")
        }
        else
        {
            ele.style.display='none'
            ele.setAttribute('hidden',true)
        }
    },

    saveRecordedStream(stream,user)
    {
        console.log("saving utils")
        let blob=new Blob(stream,{ type: 'video/webm' })
        let file = new File ([blob],`${user}-${moment().unix()}-record.webm`)
        saveAs(file)
    },

    maximiseStream(e)
    {
        let ele=e.target.parentElement.previousElementSibling
        ele.requestFullscreen() || ele.mozRequestFullScreen() || ele.webkitRequestFullscreen() || ele.msRequestFullscreen();
    },
    singleStreamMute( e ) {
        if ( e.target.classList.contains( 'fa-microphone' ) ) {
            e.target.parentElement.previousElementSibling.muted = true;
            e.target.classList.add( 'fa-microphone-slash' );
            e.target.classList.remove( 'fa-microphone' );
        }

        else {
            e.target.parentElement.previousElementSibling.muted = false;
            e.target.classList.add( 'fa-microphone' );
            e.target.classList.remove( 'fa-microphone-slash' );
        }
    },




};