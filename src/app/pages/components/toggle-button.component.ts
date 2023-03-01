import { Component, Output, EventEmitter, Input} from '@angular/core';

@Component({
  selector: 'toggle-button',
  template: `
    <input type="checkbox" id="toggle-button-checkbox" [checked]="newsletter"
      (change)="changed.emit($event.target['checked']); newsletter = $event.target['checked'];">
    <label class="toggle-button-switch" for="toggle-button-checkbox">
      <span *ngIf="newsletter" class="checked"><i class='la la-check text-white'></i></span>
    </label>
    <div class="toggle-button-text">
      <div class="toggle-button-text-on"></div>
      <div class="toggle-button-text-off"></div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      width: 65px;
      height: 30px;
    }
    
    input[type="checkbox"] {
      display: none; 
    }

    .toggle-button-switch {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 26px;
      height: 26px;
      background-color: #fff;
      border-radius: 100%;
      cursor: pointer;
      z-index: 100;
      transition: left 0.3s;
    }

    .toggle-button-text {
      overflow: hidden;
      background-color: #e7e7e7;
      border-radius: 25px;
      box-shadow: 2px 2px 5px 0 rgb(209 209 209 / 75%);
      transition: background-color 0.3s;
      height: 30px;
    }

    .toggle-button-text-on,
    .toggle-button-text-off {
      float: left;
      width: 50%;
      height: 100%;
      line-height: 30px;
      font-family: Lato, sans-serif;
      font-weight: bold;
      color: #fff;
      text-align: center;
      font-size: 12px;
    }

    input[type="checkbox"]:checked ~ .toggle-button-switch {
      left: 36px;
      background-color: #2a6889;
    }

    input[type="checkbox"]:checked ~ .toggle-button-text {
      background-color: #c4d6dd;
    }

    .checked {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  `]
})
export class ToggleButtonComponent  {
  @Input() newsletter: boolean = false;
  @Output() changed = new EventEmitter<boolean>();
}