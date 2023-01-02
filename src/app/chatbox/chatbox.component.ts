import { Component, OnInit } from '@angular/core';
import { ChatboxServiceService } from './chatbox-service.service';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import * as EmailValidator from 'email-validator';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
const socket = io('http://localhost:3000');

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.css']
})
export class ChatboxComponent implements OnInit {
  public msg: any;
  WelcomeMsg = "Hello There, Click here to start a session";
  // firstMesage = true;
  // route: any;

  constructor(private chatbbot_service: ChatboxServiceService, private route: ActivatedRoute,
    private cookieService: CookieService) { }

  webchats = []
  messages = []
  messageres = []
  businessData: any;
  recentMessage: any;
  orderObj: any;
  interval: any;
  defaultTimer: any;
  businessvfr: any;
  preResponse: any = {};
  validate = false;
  validateType: any;
  ngOnInit(): void {
    //get the business id from url

    this.route.queryParamMap
      .subscribe((params) => {
        this.orderObj = { ...params.keys, ...params };
        console.log(this.orderObj.params.bid);
      }
      );
    //check if sessionid exists\
    this.chatbbot_service.VerifyBusiness({ bid: this.orderObj.params.bid }).subscribe(res => {
      if (res.status == 200) {
        console.log(res.data)
        this.businessvfr = res.data[0];
        console.log(res.data[0], "asdbas");
      }
    })
    if (this.cookieService.get("SessionId")) {
      this.messageres = JSON.parse(localStorage.getItem(this.cookieService.get("SessionId")));
      let length = localStorage.getItem(this.cookieService.get("SessionId") + "length");
      this.recentMessage = JSON.parse(localStorage.getItem(this.cookieService.get("SessionId") + "recentMsg"));
      console.log(this.messageres, "   the messagess")
      if (length && this.recentMessage) {
        if (Number(length) != Number(this.messageres.length)) {
          //fetch conversation from db
          this.GetBusinessData(0)
          this.fetchUserConversation();
        } else {
          this.changeMessageStatus();
        }
      } else {
        this.GetBusinessData(0)
        this.fetchUserConversation();
      }
      // alert(this.cookieService.get("SessionId"))

    } else {
      // alert("hej")
      this.cookieService.set("SessionId", this.orderObj.params.bid + "|" + uuidv4());
      this.GetBusinessData(0);
    }
    this.checkIfSessionEnded()

  }

  checkIfSessionEnded() {
    console.log("from check sess", this.messageres)
    if ('endChat' in this.messageres[this.messageres.length - 1] && this.messageres[this.messageres.length - 1].endChat == 1) {
      this.endSession();
    }
  }

  changeMessageStatus() {
    if (this.messageres[this.messageres.length - 1].keyboardInput == 1) {
      this.validate = true;
      this.validateType = this.messageres[this.messageres.length - 1].expectedInput
    }
  }

  GetBusinessData(node) {
    // alert("GetBusinessData")
    // alert(this.orderObj.params.bid)
    if (Object.keys(this.preResponse).length > 0) {
      console.log(this.preResponse);
      this.messageres.push(this.preResponse);
      Object.keys(this.preResponse).forEach((key) => delete this.preResponse[key]);

    }
    this.chatbbot_service.GetBusinessData({ bid: this.orderObj.params.bid }).subscribe(res => {
      if (res.status == 200) {
        console.log(res.data, "GetBusinessData");
        this.businessData = res.data.filter(d => d.node == node);

        console.log(this.businessData, "   the business data");
        this.recentMessage = res.data[0]
        console.log(this.recentMessage);
        var msg = this.businessData[0].message.split("\\n");
        let buttons = JSON.parse(this.businessData[0].buttonValues)
        this.messageres.push({
          smid: this.businessData[0].id, type: 'Agent', message: msg, buttonValues: buttons, keyboardInput: this.businessData[0].keyboardInput, expectedInput: this.businessData[0].expectedInput, repeatMessage: this.businessData[0].repeatMessage,
          defaultResponse: this.businessData[0].defaultResponse, hasButtons: this.businessData[0].hasButtons, endChat:this.businessData[0].endChat
        })
        if (res.data[0].preResponse != undefined && res.data[0].preResponse != null && res.data[0].preResponse.length > 0) {
          this.preResponse = {
            smid: res.data[0].id, type: 'Agent', message: res.data[0].preResponse.split("\\n"),
            buttonValues: []
          }
        }
        localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));

        let index = buttons.findIndex(b => b.d == 1);
        //  alert(index);
        if (index >= 0) {
          this.defaultTimer = Number(buttons[index].t);
          let timeout = Number(buttons[index].t)
          //  alert("timer is " + this.timer);

          if (this.defaultTimer && this.defaultTimer > 0) {
            this.decrement();
          }
        }
        console.log(this.messageres)

      }
    })
  }

  sendEmail(maidId) {
    this.chatbbot_service.sendEmail({ maidId: maidId }).subscribe(res => {
      if (res.status == 200) {
        alert("mail sent")
      }
    })
  }

  sendMsg(type: any, data: any, smid: any, route: any, skill: any) {

    if (route == 1) {
      alert("You are being route to our agent please wait up of skill " + skill);
    }
    var rid = 0;

    if (smid == "" || smid == undefined) {
      smid = this.messageres[this.messageres.length - 1].smid;
    }
    if (data == "") {
      rid = 0;
      message = this.msg
    } else {
      message = data.value
      rid = data.id
    }



    if (this.businessvfr.status == 1 && this.businessvfr.chatbotType == 'static') {
      console.log("template", this.recentMessage)
      if (!this.validate || (this.validate == true && EmailValidator.validate(this.msg))) {
        // if()
        this.validate = false;
        this.chatbbot_service.GetAutoResponse({ bid: this.orderObj.params.bid, smid: smid, rid: rid, response: message, template: this.recentMessage, from: 'customer', customerId: this.cookieService.get("SessionId"), agentId: "" }).subscribe(res => {
          this.messageres.push({ type: 'Customer', message: [message] })
          if (Object.keys(this.preResponse).length > 0) {
            this.messageres.push(this.preResponse);
            Object.keys(this.preResponse).forEach((key) => delete this.preResponse[key]);
          }

          localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));
          localStorage.setItem(this.cookieService.get("SessionId") + "length", String(this.messageres.length));


          if (res.status == 200) {
            this.recentMessage = res.data[0]

            this.messageres.push({
              smid: res.data[0].id, type: 'Agent', message: res.data[0].response.split("\\n"),
              buttonValues: JSON.parse(res.data[0].buttonValues), keyboardInput: res.data[0].keyboardInput, expectedInput: res.data[0].expectedInput, repeatMessage: res.data[0].repeatMessage,
              defaultResponse: res.data[0].defaultResponse, hasButtons: res.data[0].hasButtons,endChat:res.data[0].endChat
            })
            if (this.messageres[this.messageres.length - 1].keyboardInput == 1) {
              this.validate = true;
              this.validateType = this.messageres[this.messageres.length - 1].expectedInput;
            }
            if (res.data[0].preResponse != undefined && res.data[0].preResponse != null && res.data[0].preResponse.length > 0) {
              this.preResponse = {
                smid: res.data[0].id, type: 'Agent', message: res.data[0].preResponse.split("\\n"),
                buttonValues: []
              }
            }

            if (res.data[0].endChat) {
              this.sendEmail(message);
              this.GetBusinessData(1);

            }

            localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));
            localStorage.setItem(this.cookieService.get("SessionId") + "recentMsg", JSON.stringify(this.recentMessage));
            localStorage.setItem(this.cookieService.get("SessionId") + "length", String(this.messageres.length));

          }
        })
      } else {
        this.messageres.push({ type: 'Customer', message: [this.msg] })

        this.messageres.push({
          buttonValues: this.messageres[this.messageres.length - 2].buttonValues,
          defaultResponse: "Please enter valid input",
          expectedInput: this.messageres[this.messageres.length - 2].expectedInput,
          keyboardInput: this.messageres[this.messageres.length - 2].keyboardInput,
          message: [this.messageres[this.messageres.length - 2].defaultResponse],
          repeatMessage: this.messageres[this.messageres.length - 2].repeatMessage,
          smid: this.messageres[this.messageres.length - 2].smid,
          hasButtons: this.messageres[this.messageres.length - 2].hasButtons,
          endChat:this.messageres[this.messageres.length - 2].endChat,
          type: "Agent"
        })
      }

      localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));
      localStorage.setItem(this.cookieService.get("SessionId") + "recentMsg", JSON.stringify(this.recentMessage));
      localStorage.setItem(this.cookieService.get("SessionId") + "length", String(this.messageres.length));
    }
    else if (this.businessvfr.chatbotType == 'dynamic') {
      var message = null;
      if (this.msg != undefined && this.msg.length > 0) {
        // alert(" in this.msg")
        message = this.msg;
      }
      if (data != undefined && data != null && data != '') {
        // alert("in data")
        message = data.value;
      }
      // alert(message)
      this.messageres.push({ type: 'Customer', message: [message] })
      console.log(this.messageres, " thee msggggg")
      localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));

      this.chatbbot_service.sendMsg({ message: this.msg }).subscribe(res => {
        // if(res.status == 200){
        let response = res['answer'];
        this.messageres.push({ type: 'Agent', message: [response] })
        localStorage.setItem(this.cookieService.get("SessionId"), JSON.stringify(this.messageres));
        localStorage.setItem(this.cookieService.get("SessionId") + "length", String(this.messageres.length));

        this.msg = ""
        // }
      })


    }

    window.scrollTo(0, document.body.scrollHeight);
    this.msg = undefined
  }

  fetchUserConversation() {
    this.chatbbot_service.getUserConversation({ CustomerId: this.cookieService.get("SessionId") }).subscribe(res => {

      if (res.status == 200) {
        console.log(res.data);
        res.data.filter(d => {
          if (d.msgFrom == "customer") {
            if (this.messageres) {
              this.messageres.push({ type: 'Customer', message: [d.response] });
            } else {
              this.messageres = [{ type: 'Customer', message: [d.response] }]
            }
          } else if (d.msgFrom == "bot") {
            if (this.messageres) {
              this.messageres.push({
                smid: d.id, type: 'Agent', message: d.response.split("\\n"),
                buttonValues: JSON.parse(d.buttonValues), keyboardInput: d.keyboardInput, expectedInput: d.expectedInput, repeatMessage: d.repeatMessage,
                defaultResponse: d.defaultResponse, hasButtons: d.hasButtons, endChat:d.endChat
              })
            } else {
              this.messageres = [{
                smid: d.id, type: 'Agent', message: d.response.split("\\n"),
                buttonValues: JSON.parse(d.buttonValues), keyboardInput: d.keyboardInput, expectedInput: d.expectedInput, repeatMessage: d.repeatMessage,
                defaultResponse: d.defaultResponse, hasButtons: d.hasButtons,endChat:d.endChat
              }]
            }
          }
        })
      }
    })
    if (this.messageres[this.messageres.length - 1].keyboardInput == 1) {

      this.validate = true;
      this.validateType = this.messageres[this.messageres.length - 1].expectedInput
    }
  }

  decrement() {
    this.interval = setInterval(() => {
      if (this.defaultTimer > 0) {
        this.defaultTimer--;
      } else {
        // this.defaultTimer = 60;
        clearInterval(this.interval);
        this.endSession();
      }
    }, 1000)
  }

  endSession() {
    this.chatbbot_service.endChat({CustomerId: this.cookieService.get("SessionId")}).subscribe(res => {
      if(res.status == 200){
        socket.emit("chatEnd","");
        localStorage.clear();
        this.cookieService.deleteAll();
        alert("chat ended");
        location.reload();
      } else{
        alert("an expected error occured");
        // this.endSession();
      }
    })
  }

}
