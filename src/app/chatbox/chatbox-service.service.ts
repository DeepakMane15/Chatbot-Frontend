import { Injectable } from '@angular/core';
import { HttpClientModule,HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatboxServiceService {
chatbot_url = 'http://127.0.0.1:5000/predict'
business_url = 'http://localhost:3000/agent/BusinessData'
business_vrf = 'http://localhost:3000/agent/BusinessVerification'
autoResponse_url = 'http://localhost:3000/agent/StaticAutoResponse'
userConversation_url = 'http://localhost:3000/users/UserConversation'
sendEmail_url = 'http://localhost:3000/agent/SendEmail'
endChat_url = 'http://localhost:3000/agent/EndChat'

  constructor(private http: HttpClient) { }

  private getHeader(): HttpHeaders {
  let headers: HttpHeaders = new HttpHeaders();
  headers = headers.append('accept', 'application/json');
  headers = headers.append('Access-Control-Allow-Origin', '*');
  headers = headers.append('Content-Type', 'application/json');
  return headers;
}

GetBusinessData(data:any):Observable<any>{
  return this.http.post(this.business_url,data);
}
VerifyBusiness(data:any):Observable<any>{
  return this.http.post(this.business_vrf,data);
}
GetAutoResponse(data:any):Observable<any>{
  return this.http.post(this.autoResponse_url,data);
}

sendMsg(data:any){
  return this.http.post(this.chatbot_url,data, { headers: this.getHeader() });
}

getUserConversation(data:any):Observable<any>{
  return this.http.post(this.userConversation_url,data, { headers: this.getHeader() });
}
sendEmail(data:any):Observable<any>{
  return this.http.post(this.sendEmail_url,data, { headers: this.getHeader() });
}
endChat(data:any):Observable<any>{
  return this.http.post(this.endChat_url,data, { headers: this.getHeader() });
}
}
