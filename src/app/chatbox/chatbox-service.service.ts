import { Injectable } from '@angular/core';
import { HttpClientModule,HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatboxServiceService {
url = 'http://127.0.0.1:5000/predict'
  constructor(private http: HttpClient) { }

  private getHeader(): HttpHeaders {
  let headers: HttpHeaders = new HttpHeaders();
  headers = headers.append('accept', 'application/json');
  headers = headers.append('Access-Control-Allow-Origin', '*');
  headers = headers.append('Content-Type', 'application/json');
  return headers;
}
sendMsg(data:any){
  return this.http.post(this.url,data, { headers: this.getHeader() });
}
}
