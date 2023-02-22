import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-iframe',
  templateUrl: './iframe.component.html',
  styleUrls: ['./iframe.component.css']
})
export class IframeComponent implements OnInit {

  public displayIFrame = false;
  public iFrameUrl: SafeResourceUrl
  src = "https://uatapp.unfyd.com/genesysv1/"
  chatboxUrl = "http://localhost:4200/chatbox?bid=1"
  constructor(private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
  }

  openIFrame() {
    if(!this.displayIFrame){
      this.iFrameUrl = this.sanitizer.bypassSecurityTrustResourceUrl( this.chatboxUrl);
      this.displayIFrame = true;
    } else{
      this.displayIFrame = false;

    }
  }

}
