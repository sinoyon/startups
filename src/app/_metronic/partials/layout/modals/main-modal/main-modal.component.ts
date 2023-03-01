import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-main-modal',
  templateUrl: './main-modal.component.html',
})
export class MainModalComponent implements OnInit {

  modalData: any = {};

  constructor(
    public modal: NgbActiveModal
    ) {}

  ngOnInit(): void {}
}
