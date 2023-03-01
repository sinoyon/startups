import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef, HostBinding,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  ViewRef,
  ChangeDetectorRef,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import { debounce } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';

export function isDefined(value: any) {
  return value !== undefined && value !== null;
}


export interface SelectOption {
  label: string;
  value: string;
  values?: string[];
}

@Component({
  selector: 'ae-select',
  templateUrl: './ae-select.component.html',
  styleUrls: ['./ae-select.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AeSelectComponent),
      multi: true,
    }
  ]
})
export class AeSelectComponent implements OnInit, ControlValueAccessor {

  get label(): string {
    return this.selectedOption && this.selectedOption.hasOwnProperty('label') ? this.selectedOption.label : 'Select';
  }

  get value(): string {
    return this.selectedOption ? this.selectedOption.value: null;
  }

  @Input() set value(param) {
    setTimeout(() => {
      if (!param) {this.selectedOption = null;}
      else {this.writeValue(param);}
    });

  }

  constructor(private elRef: ElementRef,
              private cdr: ChangeDetectorRef,
              private r: Renderer2,
  ) {}

  get isOpen(): boolean {
    return this.opened;
  }
  @Input() options: SelectOption[] = [];
  // tslint:disable-next-line:no-input-rename
  @Input('hidden') isHidden: boolean;
  @Input() maxHeight = '400px';
  @Input() showSearch = false;
  @Input() defaultUI = false;

  loadingSubject = new BehaviorSubject<boolean>(true);
	loading$: Observable<boolean>;
  loading = false;

  keyword = '';
  changedKeyword = true;

  selectedOption: SelectOption;
  disabled = false;
  optionId = 0;

  opened = false;

  @HostBinding('style.display') hidden = 'inline-block';

  // tslint:disable-next-line:no-output-native no-output-rename
  @Output('change') changeEvent = new EventEmitter();

  @ViewChild('labelButton', {static: false}) labelButton: ElementRef;
  @ViewChild('searchInput', {static: false}) searchInput: ElementRef;

  onSearch = debounce(async (e) => {
		const value = e.target.value;

		if (!this.loadingSubject.getValue()) {
			setTimeout(async () => {
        const keyword = value;
        this.loadingSubject.next(true);
				try {
					await this.searchCb(keyword);
				} catch (error) {
					console.log(error);
				}
				if (!(this.cdr as ViewRef).destroyed) {
          this.cdr.detectChanges();
        }
        this.loadingSubject.next(false);
			}, 0);
		} else {
			if (value != this.keyword) {
				this.changedKeyword = true;
			}
		}
		this.keyword = value;
	}, 500);
  @Input() searchCb = async (e) => {};

  ngOnInit() {
    this.selectedOption = this.options[0];
    if (isDefined(this.isHidden) && this.isHidden) {
      this.hide();
    }
    this.loadingSubject.subscribe( _incomingValue => {
			this.loading = _incomingValue;
			if (!_incomingValue && this.changedKeyword) {
				this.changedKeyword = false;
				setTimeout(async () => {
          this.loadingSubject.next(true);
          try {
            await this.searchCb(this.keyword);
          } catch (error) {

          }
          this.loadingSubject.next(false);
          if (!(this.cdr as ViewRef).destroyed) {
            this.cdr.detectChanges();
          }
				}, 10);
			}
		});
		this.loadingSubject.next(false);
  }

  hide() {
    this.hidden = 'none';
  }

  optionSelect(option: SelectOption, event: MouseEvent) {
    event.stopPropagation();
    this.setValue(option.value);
    this.onChange(this.selectedOption.value);
    this.changeEvent.emit(this.selectedOption.value);
    this.onTouched();
    this.opened = false;
  }

  toggleOpen(event: MouseEvent) {
    // event.stopPropagation();
    if (this.disabled) {
      return;
    }
    this.opened = !this.opened;
    if (this.opened) {
      setTimeout(()=>{
        if (this.searchInput) {this.searchInput.nativeElement.focus();}
      },0);
    }
  }

  @HostListener('document:click', ['$event'])
  onClick($event: MouseEvent) {
    if (!this.elRef.nativeElement.contains($event.target)) {
      this.close();
    }
  }

  close() {
    this.opened = false;
  }

  writeValue(value) {
    if (!value || typeof value !== 'string') {
      return;
    }
    this.setValue(value);
  }

  setValue(value) {
    let index = 0;
    const selectedEl = this.options.find((el, i) => {
      index = i;
      return el.value === value;
    });
    if (selectedEl) {
      this.selectedOption = selectedEl;
      this.optionId = index;
    }
  }

  onChange: any = () => {
  };
  onTouched: any = () => {
  };

  registerOnChange(fn) {
    this.onChange = fn;
  }

  registerOnTouched(fn) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.labelButton.nativeElement.disabled = isDisabled;
    const div = this.labelButton.nativeElement;
    const action = isDisabled ? 'addClass' : 'removeClass';
    this.r[action](div, 'disabled');
    this.disabled = isDisabled;
  }

  @HostListener('keydown', ['$event'])
  handleKeyDown($event: KeyboardEvent) {
    if (!this.opened) {
      return;
    }
    // console.log($event.key);
    // if (KeyCode[$event.key]) {
    switch ($event.key) {
      case 'ArrowDown':
        this._handleArrowDown($event);
        break;
      case 'ArrowUp':
        this._handleArrowUp($event);
        break;
      case 'Space':
        this._handleSpace($event);
        break;
      case 'Enter':
        this._handleEnter($event);
        break;
      case 'Tab':
        this._handleTab($event);
        break;
      case 'Escape':
        this.close();
        $event.preventDefault();
        break;
      case 'Backspace':
        this._handleBackspace();
        break;
    }
    // } else if ($event.key && $event.key.length === 1) {
    // this._keyPress$.next($event.key.toLocaleLowerCase());
    // }
  }

  _handleArrowDown($event) {
    if (this.optionId < this.options.length - 1) {
      this.optionId++;
    }
  }

  _handleArrowUp($event) {
    if (this.optionId >= 1) {
      this.optionId--;
    }
  }

  _handleSpace($event) {

  }

  _handleEnter($event) {
    this.optionSelect(this.options[this.optionId], $event);
  }

  _handleTab($event) {

  }

  _handleBackspace() {

  }
}
