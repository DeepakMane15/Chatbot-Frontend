
import { ClassField } from '@angular/compiler';
import { Component, OnInit } from '@angular/core';
import { ChatboxServiceService } from './chatbox-service.service';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit {

  public msg;

  constructor(private chatbbot_service : ChatboxServiceService) { }
  webchats = [{
    type:'Customer',
    message: "Hello"
  },
  {  type:'Agent',
  message: "Hello"
}
]
  messages = []
  messageres = [{
    type:'Agent',
    message: "Hello hi "
  },
  {  type:'Customer',
  message: "Hello"
}]
  ngOnInit(): void {
  }

  sendMsg(){
    if(this.msg != undefined && this.msg.length > 0)
    this.messageres.push({type:'Customer', message:this.msg})
    this.chatbbot_service.sendMsg({message:this.msg}).subscribe(res => {
      console.log(res['answer'])
      let response = res['answer'];
      this.messageres.push({type:'Agent', message:response})
    })
    console.log(this.messageres);
    this.msg=undefined
  }
}
