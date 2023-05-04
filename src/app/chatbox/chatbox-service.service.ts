import { Injectable } from '@angular/core';
import { HttpClientModule, HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Data } from '@angular/router';


@Injectable({
  providedIn: 'root'
})
export class ChatboxServiceService {
  private socket: Socket;
  private url = 'http://localhost:3000'; // your server local path

  chatbot_url = 'http://127.0.0.1:5000/predict'
  business_url = 'http://localhost:3000/agent/BusinessData'
  business_vrf = 'http://localhost:3000/agent/BusinessVerification'
  autoResponse_url = 'http://localhost:3000/agent/StaticAutoResponse'
  userConversation_url = 'http://localhost:3000/users/UserConversation'
  sendEmail_url = 'http://localhost:3000/agent/SendEmail'
  endChat_url = 'http://localhost:3000/agent/EndChat'
  businessConfigurations_url = 'http://localhost:3000/agent/BusinessConfigurations'
  routeChat_url = 'http://localhost:3000/agent/RouteChat'
  agentChat_url = 'http://localhost:3000/agent/AgentChat'

  public dataSubject = new Subject<Data>();
  public dataState = this.dataSubject.asObservable();

  public dataSubject1 = new Subject<Data>();
  public dataState1 = this.dataSubject1.asObservable();

  public dataSubject2 = new Subject<Data>();
  public dataState2 = this.dataSubject2.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(this.url, { transports: ['websocket', 'polling', 'flashsocket'] });
  }

  private getHeader(): HttpHeaders {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('accept', 'application/json');
    headers = headers.append('Access-Control-Allow-Origin', '*');
    headers = headers.append('Content-Type', 'application/json');
    return headers;
  }
  joinRoom(data): void {
    this.socket.emit('join', data);
  }
  agentJoinedMessage(): void {
    this.socket.on('agentJoinedMessage', (msg: any) => {
      // alert("msg")
      console.log("in onNewMessage 1", msg)
      this.dataSubject.next(msg);
      // this._sharedService.dataSubject.next(msg);
      // alert(msg)
    })
  }
  sendAgentMessageBySocket(data):void{
    this.socket.emit("sendMessage",data)
  }
  receiveAgentMessageBySocket():void{
    console.log("in onNewMessage")
    // return new Observable(observer => {
      this.socket.on('getMessage', (msg: any) => {
        // alert("msg")
        console.log("in onNewMessage 1",msg)
         // observer.next(msg);
         this.dataSubject1.next(msg);
        //  alert(msg);
      });
  }

  AgentChatEnd():void{
    this.socket.on("agentChatEndMessage", (data) => {
      this.dataSubject2.next(data);
    })
  }

  SendAgentMessage(data: any): Observable<any> {
    return this.http.post(this.agentChat_url, data);
  }
  GetBusinessData(data: any): Observable<any> {
    return this.http.post(this.business_url, data);
  }
  VerifyBusiness(data: any): Observable<any> {
    return this.http.post(this.business_vrf, data);
  }
  GetAutoResponse(data: any): Observable<any> {
    return this.http.post(this.autoResponse_url, data);
  }

  sendMsg(data: any) {
    return this.http.post(this.chatbot_url, data, { headers: this.getHeader() });
  }

  getUserConversation(data: any): Observable<any> {
    return this.http.post(this.userConversation_url, data, { headers: this.getHeader() });
  }
  sendEmail(data: any): Observable<any> {
    return this.http.post(this.sendEmail_url, data, { headers: this.getHeader() });
  }
  endChat(data: any): Observable<any> {
    return this.http.post(this.endChat_url, data, { headers: this.getHeader() });
  }
  businessConfigurations(data: any): Observable<any> {
    return this.http.post(this.businessConfigurations_url, data, { headers: this.getHeader() });
  }
  routeChat(data: any): Observable<any> {
    return this.http.post(this.routeChat_url, data, { headers: this.getHeader() });
  }
}
