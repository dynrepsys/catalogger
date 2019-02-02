import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LogsView } from './logsview.component';
import { DirView } from './dirview.component';
import { FileView } from './fileview.component';
import { LogView } from './logview.component';

@NgModule({
  declarations: [
    AppComponent,
    LogsView,
    DirView,
    FileView,
    LogView
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
