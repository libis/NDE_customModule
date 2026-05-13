import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import {LIBISProgressSpinnerComponent} from "../libis-progress-spinner/libis-progress-spinner.component";
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'libis-copy-to-clipboard',
  standalone: true,
  imports: [CommonModule, LIBISProgressSpinnerComponent, MatIconModule, MatTooltipModule, TranslateModule],
  templateUrl: './libis-copytoclipboard.component.html',
  styleUrl: './libis-copytoclipboard.component.scss'
})
export class LibisCopytoclipboardComponent implements OnDestroy, OnChanges{
  @Input() text!: string | null;
  @Input() tooltipText!: string;
  @Input() tooltipSuccessText!: string;
  @Input() isLoading!:boolean;
  @ViewChild('richTextDiv') richTextDiv!: ElementRef;
  timer!: number;
  btnClicked = false;
  successMessage: string = '';
    
constructor(private translate: TranslateService) {
    this.successMessage =
      this.translate.instant('nui.citation.message.success');
  }

  onCopyToClipboard() {
    this.btnClicked = true;
    this.timer = window.setTimeout(
      () => {
        this.btnClicked = false;
      }, 10000
    );

    const decodedText = this.decodeHtmlEntities(this.text ? String(this.text).replace(/<[^>]+>/gm, '') : '');

    const listener = (e:ClipboardEvent) => {
      e.clipboardData?.setData("text/html", this.richTextDiv.nativeElement.innerHTML);
      e.clipboardData?.setData("text/plain", decodedText);
      e.preventDefault();
    }

    document.addEventListener("copy", listener);
    //The execCommand() is officially obsolete/deprecated but there's no alternative. So for rich text support, we have to keep using execCommand()
    document.execCommand("copy");
    document.removeEventListener("copy", listener);

  }

  decodeHtmlEntities(text: string): string {
    return text.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&#38;/g, '&')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x2F;/g, '/');
  }


  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  ngOnChanges() {
    clearTimeout(this.timer);
    this.btnClicked = false;
  }
}
