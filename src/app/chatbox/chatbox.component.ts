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
  noResponseInterval: any
  defaultTimer: any;
  businessvfr: any;
  preResponse: any = {};
  validate = false;
  validateType: any;
  businessConfigurations: any;
  noResponseTimeout: any;
  timeEnabled = true;
  chatWithAgent = false;
  AgentId: any;


  ngOnInit(): void {
    this.route.queryParamMap
      .subscribe((params) => {
        this.orderObj = { ...params.keys, ...params };
        console.log(this.orderObj.params.bid);
      }
      );
    //check if sessionid exists\
    this.chatbbot_service.VerifyBusiness({ ActionFlag: "FETCH", Action: "VerifyBusiness", bid: this.orderObj.params.bid, cacheEnabled:false }).subscribe(res => {
      console.log(res)
      if (res.status == 200) {
        console.log(res.data)
        this.businessvfr = res.data[0];
        console.log(res.data[0], "asdbas");
      }
    })
    this.getBusinessConfigurations(this.orderObj.params.bid);
    console.log("this.businessConfigurations " + this.businessConfigurations)
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
      let SessionID = this.orderObj.params.bid + "|" + uuidv4()
      this.cookieService.set("SessionId", SessionID);
      this.chatbbot_service.joinRoom(SessionID);
      this.GetBusinessData(0);
    }
    this.checkIfSessionEnded()
    this.chatbbot_service.agentJoinedMessage()
    this.chatbbot_service.dataState.subscribe(
      (data: any) => {
        console.log(data);
        this.AgentId = data.agentId
        // alert(this.AgentId)
        this.chatWithAgent = true;
        this.validate = true;
        // AgentJoinMessage
        let agentJoinMessage = this.businessConfigurations.filter(d => d.configurationName == 'AgentJoinMessage');
        console.log(this.businessConfigurations)
        // if(data.agentName != undefined){
        agentJoinMessage = agentJoinMessage[0].configurationValue.replace("{{name}}", data.agentName)
        this.messageres.push({
          type: 'Agent', message: agentJoinMessage.split("\\n"),
          buttonValues: [{}], keyboardInput: 1
        })
      }
      // }
    )
    this.chatbbot_service.receiveAgentMessageBySocket();
    this.chatbbot_service.dataState1.subscribe(data => {
      this.messageres.push({
        type: 'Agent', message: [data],
        buttonValues: [{}], keyboardInput: 1
      })
    })

    this.chatbbot_service.AgentChatEnd();
    this.chatbbot_service.dataState2.subscribe(data => {
      let endMessage = this.businessConfigurations.filter(d => d.configurationName == 'AgentChatEndMessage');
      this.messageres.push({
        type: 'Agent', message: endMessage[0].configurationValue.split("\\n"),
        buttonValues: [{}], keyboardInput: 0
      })
      let timer = 3
      this.interval = setInterval(() => {
        if (timer > 0) {
          timer--;
        } else {
          // this.defaultTimer = 60;
          clearInterval(this.interval);
          this.endSession();
        }
      }, 3000)
    })
    // if()

  }

  checkIfSessionEnded() {
    console.log("from check sess", this.messageres)
    if (this.messageres != undefined && this.messageres != null && this.messageres.length > 0) {
      if ('endChat' in this.messageres[this.messageres.length - 1] && this.messageres[this.messageres.length - 1].endChat == 1) {
        this.endSession();
      }
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
          defaultResponse: this.businessData[0].defaultResponse, hasButtons: this.businessData[0].hasButtons, endChat: this.businessData[0].endChat
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
        // alert("mail sent")
      }
    })
  }

  async sendMsg(type: any, data: any, smid: any, route: any, skill: any) {
    await clearInterval(this.noResponseInterval);
    if (route == 'true') {
      this.timeEnabled = false
      // alert(route)
      let Data = {
        ActionFlag: 'ADD',
        bid: this.orderObj.params.bid,
        customerId: this.cookieService.get("SessionId")
      }
      console.log(Data)
      this.chatbbot_service.routeChat(Data).subscribe(res => {
        console.log("res", res)
        if (res.status == 200) {
          // alert("You are being route to our agent " + skill);
          this.messageres.push({ type: 'Customer', message: [data.value] })
          console.log(this.businessConfigurations)
          let routeMessage = this.businessConfigurations.filter(d => d.configurationName == 'RouteMessage');
          console.log(routeMessage[0].configurationValue)
          this.messageres.push({
            smid: this.messageres[this.messageres.length - 1].smid, type: 'Agent', message: routeMessage[0].configurationValue.split("\\n"),
            buttonValues: [{}], keyboardInput: this.messageres[this.messageres.length - 1].keyboardInput, expectedInput: this.messageres[this.messageres.length - 1].expectedInput, repeatMessage: this.messageres[this.messageres.length - 1].repeatMessage,
            defaultResponse: this.messageres[this.messageres.length - 1].defaultResponse, hasButtons: 0, endChat: this.messageres[this.messageres.length - 1].endChat, attributeValue: this.messageres[this.messageres.length - 1].attributeValue
          })
          console.log(this.messageres)
        }
      })
      let roomId = "bid-" + this.orderObj.params.bid
      socket.emit("fetchInteractions", roomId)
      socket.emit("join", this.cookieService.get("SessionId"))
    }
    var rid = 0;

    var aid = ""
    if (data.aid != undefined && data.aid != "" && data.aid != null) {
      aid = data.aid;
    }

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


    if (this.chatWithAgent) {
      // alert("hh");
      // socket.emit("sendMessage", { room: this.cookieService.get("SessionId"), message: message });

      let parameters = {
        bid: this.orderObj.params.bid,
        type: 'text',
        response: this.msg,
        from: 'customer',
        customerId: this.cookieService.get('SessionId'),
        agentId: this.AgentId
      }
      this.chatbbot_service.SendAgentMessage(parameters).subscribe(res => {
        if (res.status == 200) {
          // alert(message)
          this.messageres.push({ type: 'Customer', message: [message] })
          this.chatbbot_service.sendAgentMessageBySocket({ room: this.cookieService.get("SessionId"), message: message })

        }
      })
    }
    else if (this.businessvfr.status == 1 && this.businessvfr.chatbotType == 'static') {
      console.log("template", this.recentMessage)
      if (!this.validate || (this.validate == true && (this.validateType == 'email') ? EmailValidator.validate(this.msg) : true)) {
        // if()
        this.validate = false;
        let customerAttribute = 'false';
        let attributeName = null;
        let attributeValue = null;
        if (this.messageres[this.messageres.length - 1].attributeValue == 1) {
          customerAttribute = 'true';
          attributeName = this.messageres[this.messageres.length - 1].expectedInput;
          attributeValue = message
        }
        this.chatbbot_service.GetAutoResponse({ ActionFlag: "FETCH", bid: this.orderObj.params.bid, aid: aid, smid: smid, rid: rid, response: message, template: this.recentMessage, from: 'customer', customerId: this.cookieService.get("SessionId"), agentId: "", customerAttribute: customerAttribute, attributeName: attributeName, attributeValue: attributeValue }).subscribe(res => {
          if (route != 'true') {
            this.messageres.push({ type: 'Customer', message: [message] })
          }
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
              defaultResponse: res.data[0].defaultResponse, hasButtons: res.data[0].hasButtons, endChat: res.data[0].endChat, attributeValue: res.data[0].attributeValue
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

            if (res.data[0].endChat != 1) {
              this.ResponseTimer(this.noResponseTimeout, route);
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
          defaultResponse: this.messageres[this.messageres.length - 2].defaultResponse,
          expectedInput: this.messageres[this.messageres.length - 2].expectedInput,
          keyboardInput: this.messageres[this.messageres.length - 2].keyboardInput,
          message: [this.messageres[this.messageres.length - 2].defaultResponse],
          repeatMessage: this.messageres[this.messageres.length - 2].repeatMessage,
          smid: this.messageres[this.messageres.length - 2].smid,
          hasButtons: this.messageres[this.messageres.length - 2].hasButtons,
          endChat: this.messageres[this.messageres.length - 2].endChat,
          type: "Agent", attributeValue: this.messageres[this.messageres.length - 2].attributeValue
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

  ResponseTimer(time: any, route: any) {
    // alert("ResponseTimer " + route)
    this.noResponseInterval = setInterval(() => {
      if (time > 0) {
        time--;
      } else {
        clearInterval(this.noResponseInterval);

        let timeoutMessage = this.businessConfigurations.filter(d => d.configurationName == 'NoResponseTimeoutMessage')

        this.messageres.push({
          smid: this.messageres[this.messageres.length - 1].smid, type: 'Agent', message: timeoutMessage[0].configurationValue.split("\\n"),
          buttonValues: [{}], keyboardInput: this.messageres[this.messageres.length - 1].keyboardInput, expectedInput: this.messageres[this.messageres.length - 1].expectedInput, repeatMessage: this.messageres[this.messageres.length - 1].repeatMessage,
          defaultResponse: this.messageres[this.messageres.length - 1].defaultResponse, hasButtons: 0, endChat: this.messageres[this.messageres.length - 1].endChat, attributeValue: this.messageres[this.messageres.length - 1].attributeValue
        })
        // let int;
        // int = setInterval(() => {
        if (route == undefined) {
          this.endSession();
        }
        //   clearInterval(int);
        // }, 2000)

      }
    }, 1000)
  }

  getBusinessConfigurations(bid: any) {
    if (localStorage.getItem("businessConfigurations") == null || localStorage.getItem("businessConfigurations") == undefined) {
      this.chatbbot_service.businessConfigurations({ actionFlag: "FETCH", bid: bid, fromCache: true }).subscribe(res => {
        console.log(res)
        if (res.status == 200) {
          console.log("businessCOnfig ", res.data)
          this.noResponseTimeout = res.data.filter(d => d.configurationName == 'NoResponseTimeout');
          this.noResponseTimeout = this.noResponseTimeout[0].configurationValue
          localStorage.setItem("businessConfigurations", JSON.stringify(res.data));
          this.businessConfigurations = res.data;
        }
      })
    } else {
      let configurations = JSON.parse(localStorage.getItem("businessConfigurations"))
      this.businessConfigurations = configurations;
      this.noResponseTimeout = configurations.filter(d => d.configurationName == 'NoResponseTimeout');
      this.noResponseTimeout = this.noResponseTimeout[0].configurationValue

    }
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
                defaultResponse: d.defaultResponse, hasButtons: d.hasButtons, endChat: d.endChat, attributeValue: d.attributeValue
              })
            } else {
              this.messageres = [{
                smid: d.id, type: 'Agent', message: d.response.split("\\n"),
                buttonValues: JSON.parse(d.buttonValues), keyboardInput: d.keyboardInput, expectedInput: d.expectedInput, repeatMessage: d.repeatMessage,
                defaultResponse: d.defaultResponse, hasButtons: d.hasButtons, endChat: d.endChat, attributeValue: d.attributeValue
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
    this.chatbbot_service.endChat({ CustomerId: this.cookieService.get("SessionId") }).subscribe(res => {
      if (res.status == 200) {
        // this.join();

        socket.emit("chatEnd", "bid-" + this.orderObj.params.bid);
        localStorage.clear();
        this.cookieService.deleteAll();
        alert("chat ended");
        location.reload();
      } else {
        alert("an expected error occured");
        // this.endSession();
      }
    })
  }


}
