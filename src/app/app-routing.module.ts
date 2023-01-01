import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatboxComponent } from './chatbox/chatbox.component';
import { IframeComponent } from './iframe/iframe.component';

const routes: Routes = [
  {path:"chatbox", component:ChatboxComponent},
  {path:"", component:IframeComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
