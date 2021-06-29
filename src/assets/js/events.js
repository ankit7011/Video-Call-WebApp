import utils from './utils.js';
window.addEventListener('load',()=>{
    
    // tirgger on clicking Create room button
    document.getElementById('create-room').addEventListener('click', (e)=>{
        e.preventDefault(); //prevent from happing the event ,if this is use the default function will not work like submit will not submit or clicking url will not open link
        let roomName=document.querySelector('#room-name').value;
        let yourName=document.querySelector('#your-name').value;
        
        if(roomName && yourName)
        {
            //removing error message,if any
            document.querySelector('#err-msg').innerHTML="";
            
            //save user name in session Storage
            sessionStorage.setItem('username',yourName);
            
            //createing room link
            let roomLink = `${location.origin}?room=${roomName.trim().replace(' ','_')}_${utils.generateRandomString()}`;
            
            //show message and link to room
            //console.log(roomLink + "sds");
            document.querySelector('#room-created').innerHTML =`Room Created. Enter in Room By Clicking this <a href='${roomLink}'>link</a> . Invite your Friend By sharing the Link`;

            //empty the Values
            document.querySelector('#room-name').value="";
            document.querySelector('#your-name').value="";
            
    
        }
        else
        {
            document.querySelector('#err-msg').innerHTML='All Feilds are required !!!';
        }
    });

    //trigger when 'Enter room' btn is clicked
    document.getElementById('enter-room').addEventListener('click',(e)=>{
        e.preventDefault();

        let uname=document.querySelector('#username').value
        if(uname)
        {
            //remove err if any
            document.querySelector('#err-msg-username').innerHTML="";

            //save the user's name  in sessionStorage
            sessionStorage.setItem('username',uname);

            //reload room
            location.reload();
        }
        else 
        {
            document.querySelector('#err-msg-username').innerHTML="Please Enter Your Name !!! "
        }
    })


    //On clicking chat icon 
    document.querySelector('#toggle-chat-pane').addEventListener('click',(e)=>{
        let chatelem=document.querySelector('#chat-pane')
        let mainSec=document.querySelector('#main-section')

        if( chatelem.classList.contains('chat-opened') )
        {
            chatelem.setAttribute('hidden',true)
            mainSec.classList.remove('col-md-9')
            mainSec.classList.add('col-md-12')
            chatelem.classList.remove('chat-opened')
        }
        else
        {
            chatelem.attributes.removeNamedItem('hidden')
            mainSec.classList.remove('col-md-12')
            mainSec.classList.add('col-md-9')
            chatelem.classList.add('chat-opened')
        }

        setTimeout(()=>{
            if(document.querySelector('#chat-pane').classList.contains('chat-opened'))
            {
                utils.toggleChatNotiBadge();
            }
        },300)

    })

    document.addEventListener('click',(e)=>{
        if(e.target && e.target.classList.contains('expand-remote-video'))
        {
            utils.maximiseStream(e)
        }
        else if ( e.target && e.target.classList.contains('mute-remote-mic'))
        {
            console.log("in mute")
            utils.singleStreamMute(e);
        }
    })

    document.getElementById('closeModal').addEventListener('click',()=>{
        utils.toggleModal('recording-options-modal',false)
    })

});