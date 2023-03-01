import { SplashScreenService } from './../../../../_metronic/partials/layout/splash-screen/splash-screen.service';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of, Subscription, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import {union, cloneDeep, unionWith} from 'lodash';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AliasMoveDialog } from '../alias-move-dialog/alias-move-dialog';
import { AliasService } from 'src/app/pages/common/alias.service';
import { ToastService } from 'src/app/pages/common/toast.service';

@Component({
  selector: 'app-alias-edit',
  templateUrl: './alias-edit.component.html',
  styleUrls: ['./alias-edit.component.scss']
})
export class AliasEditComponent implements OnInit, OnDestroy {

  @ViewChild('synonymsInput') synonymsInput: ElementRef;

  id;
  alias;
  previous;
  formGroup: FormGroup;
  isLoading$: Observable<boolean>;
  loadingSubject = new BehaviorSubject<boolean>(true);
  errorMessage = '';

  currentSynonyms = [];
  currentSynonym;
  currentSynonymIndex = -1;
  currentName;

  currentLanguage = 'italy';

  pictureFile;
  selectableCategories = [];

  link: any;
  description: any;

  article: any;
  articleTitle: any;
  articleImageUrl: any;
  articleDescription: any;
  articleDate: any;

  @ViewChild('languageSelector', {static: false}) languageSelector;

  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private aliasService: AliasService,
    private cdr: ChangeDetectorRef,
    private modal: NgbModal,
    private toastService: ToastService,
    private splashScreenService: SplashScreenService
  ) { }

  ngOnInit(): void {
    this.loadingSubject = this.splashScreenService.loadingSubject;
    this.isLoading$ = this.loadingSubject.asObservable();
    this.loadAlias();
  }

  loadAlias() {
    const sb = this.route.paramMap.pipe(
      switchMap(async params => {
        // get id from URL
        const id = params.get('id');
        if (id) {
          try {
            const alias = await this.aliasService.getById(id);
            return alias;
          } catch (error) {
            console.log(error);
          }
          return undefined;
        }

        return {
          synonyms: [],
          names: []
        };
      }),
      catchError((errorMessage) => {
        this.errorMessage = errorMessage;
        return of(undefined);
      }),
    ).subscribe((res: any) => {
      if (!res) {
        this.router.navigate(['/admin/aliases'], { relativeTo: this.route });
      }

      this.alias = res;
      this.previous = Object.assign({}, res);
      console.info('alias : ', this.alias)
      this.loadForm();

      this.synonymsInput.nativeElement.addEventListener('paste', e=>{
        const data = (e.clipboardData).getData('text/plain');
        const synonyms = data.split(',').map( el => ({ language: this.currentLanguage, value: el.trim()}));
        this.currentSynonyms =
        unionWith(this.currentSynonyms, synonyms , (a,b) => a.language == b.language && a.value == b.value);
        if (!(this.cdr as ViewRef).destroyed ) {
          this.cdr.detectChanges();
        }
      });
    });
    this.unsubscribe.push(sb);
  }

  async loadForm() {
    if (!this.alias) {
      return;
    }

    this.formGroup = this.fb.group({
      type: [this.alias.type, Validators.compose([Validators.required])],
    });

    if (!(this.cdr as ViewRef).destroyed) {
      this.cdr.detectChanges();
    }

    if (this.languageSelector) {
      this.languageSelector.options = [
        { label: 'Italian', value: 'it'},
        { label: 'Spain', value: 'es'},
        { label: 'France', value: 'fr'},
        { label: 'Germany', value: 'de'},
        { label: 'English', value: 'en'}
      ];

      setTimeout(() => {
        const language = (this.alias.names[0] || {}).language || 'it';
        this.languageSelector.writeValue(language);
        this.currentLanguage = language;
        this.currentName = (this.alias.names.find(el => el.language == language) || {}).value;
        this.description = ((this.alias.descriptions || []).find(el => el.language == language) || {}).value;
        this.link = this.alias.link;
        this.currentSynonyms = this.alias.synonyms.filter( el => el.language == language);

        this.article = this.alias.article;
        this.articleTitle = this.alias.articleTitle;
        this.articleImageUrl = this.alias.articleImageUrl;
        this.articleDescription = this.alias.articleDescription;
        this.articleDate = this.alias.articleDate ? new Date(this.alias.articleDate) : null;

        if (!(this.cdr as ViewRef).destroyed) {
          this.cdr.detectChanges();
        }
      }, 320);
    }
  }

  reset() {
    if (!this.previous) {
      return;
    }

    this.alias = Object.assign({}, this.previous);
    this.loadForm();
  }

  save() {
    this.formGroup.markAllAsTouched();
    if (!this.formGroup.valid) {
      return;
    }
    this.loadingSubject.next(true);
    const formValues = this.formGroup.value;
    this.alias = Object.assign(this.alias, formValues);

    this.alias.link = this.link;

    this.alias.names =
    unionWith(this.alias.names.filter( el => el.language != this.currentLanguage), [{language: this.currentLanguage, value: this.currentName}], (a,b) => a.language == b.language);

    this.alias.descriptions =
    unionWith(this.alias.descriptions.filter( el => el.language != this.currentLanguage), [{language: this.currentLanguage, value: this.description}], (a,b) => a.language == b.language);

    this.alias.synonyms = unionWith(this.alias.synonyms.filter( el => el.language != this.currentLanguage),
    this.currentSynonyms, (a,b) => a.language == b.language && a.value == b.value);

    this.alias.article = this.article;
    this.alias.articleTitle = this.articleTitle;
    this.alias.articleImageUrl = this.articleImageUrl;
    this.alias.articleDescription = this.articleDescription;
    this.alias.articleDate = this.articleDate;

    if (this.alias._id) {
      this.edit();
    } else {
      this.create();
    }
  }

  async edit() {
    const res = await this.aliasService.update(this.alias);
    this.loadingSubject.next(false);
    if (res) {
      this.router.navigate(['/admin/aliases']);
    } else {

    }
  }

  create() {
    const res = this.aliasService.create(this.alias);
    this.loadingSubject.next(false);
    if (res) {
      this.router.navigate(['/admin/aliases']);
    } else {

    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }

  // helpers for View
  isControlValid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.valid && (control.dirty || control.touched);
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  controlHasError(validation: string, controlName: string) {
    const control = this.formGroup.controls[controlName];
    return control.hasError(validation) && (control.dirty || control.touched);
  }

  isControlTouched(controlName: string): boolean {
    const control = this.formGroup.controls[controlName];
    return control.dirty || control.touched;
  }

  onAddValue() {
    if (this.currentSynonymIndex >= 0) {
			return;
    }
		if (this.currentSynonym && this.currentSynonym.trim() != '')
		{
			if (this.currentSynonymIndex == -1) {
				this.currentSynonyms.push({ language: this.currentLanguage, value:this.currentSynonym});
				this.currentSynonym = '';
				this.currentSynonymIndex = -1;
			}
		}
	}
	onUpdateValue() {
		if (this.currentSynonym && this.currentSynonym.trim() != '')
		{
			if (this.currentSynonymIndex >= 0 && this.currentSynonyms.length >= this.currentSynonymIndex + 1){
				this.currentSynonyms[this.currentSynonymIndex].value = this.currentSynonym;
				this.currentSynonymIndex = -1;
				this.currentSynonym = '';
			}
		}
	}
	async onMoveValue(value, index) {
		if (this.currentSynonymIndex >= 0) {
			return;
    }
    try {
      const modalRef = this.modal.open(AliasMoveDialog, { animation: false});
      modalRef.componentInstance.init([value], this.alias._id, this.formGroup.get('type').value);
      const subscr = modalRef.closed.subscribe( async res => {
        this.currentSynonyms.splice(index, 1);
        if (!(this.cdr as ViewRef).destroyed) {
          this.cdr.detectChanges();
        }
        setTimeout(() => subscr.unsubscribe(), 100);
      });
    } catch (error) {

    }

	}

	onCancelValue() {
		this.currentSynonymIndex = -1;
		this.currentSynonym = '';
	}

	onEditValue(param, index) {
		if (this.currentSynonymIndex >= 0) {
			return;
		}
		this.currentSynonym = param.value;
		this.currentSynonymIndex = index;
	}
	onDeleteValue(param, index) {
		if (this.currentSynonymIndex >= 0) {
			return;
		}
		this.currentSynonyms.splice(index, 1);
	}
	async picInputChanged(event){
		try {
			if (event.target.files && event.target.files[0]){
        var fileExtention = event.target.files[0].name.substring(event.target.files[0].name.lastIndexOf('.') + 1);
				const formData = new FormData();
				formData.append('pic', event.target.files[0],this.alias._id + `_${new Date().getTime()}`);
				const res = await this.aliasService.uploadPicture(formData);
				if (res) {
					this.alias.pic = res.result;
          await this.aliasService.update({_id: this.alias._id, pic: this.alias.pic});
					this.cdr.detectChanges();
				}
			}
		} catch (error) {

		}
	}
	onRemovePic() {
		this.alias.pic = null;
		document.getElementById('alias_pic_preview').style.backgroundImage = ``;
  }
  onChangeLanguage(value, ctrl) {
    if (!value) {return;}
    setTimeout(() => {
      // pre save

      const currentName = this.alias.names.find(el => el.language == this.currentLanguage);
      if (currentName) {
        currentName.value = this.currentName;
      } else {
        this.alias.names =
        unionWith(this.alias.names, [{language: this.currentLanguage, value: this.currentName}], (a,b) => a.language == b.language && a.value == b.value);
      }


      const currentDesc = this.alias.descriptions.find(el => el.language == this.currentLanguage);
      if (currentDesc) {
        currentDesc.value = this.description;
      } else {
        this.alias.descriptions =
        unionWith(this.alias.descriptions, [{language: this.currentLanguage, value: this.description}], (a,b) => a.language == b.language && a.value == b.value);
      }

      this.alias.synonyms = unionWith(this.alias.synonyms.filter( el => el.language != this.currentLanguage),
      this.currentSynonyms, (a,b) => a.language == b.language && a.value == b.value);

      this.currentLanguage = this.languageSelector.value;

      // load current language
      this.currentName = (this.alias.names.find(el => el.language == this.currentLanguage) || {}).value;
      this.description = (this.alias.descriptions.find(el => el.language == this.currentLanguage) || {}).value;

      this.currentSynonyms = this.alias.synonyms.filter( el => el.language == this.currentLanguage);
      if (!(this.cdr as ViewRef).destroyed) {
        this.cdr.detectChanges();
      }
    });
	}
  onCopyAll() {
    const synonyms = this.currentSynonyms.map( el => el.value).join(', ');
    const el = document.createElement('textarea');
    el.value = synonyms;
    document.body.appendChild(el);
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (iOS){
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      el.setSelectionRange(0, 999999);
    } else {
      el.select();
    }
    document.execCommand('copy');
    document.body.removeChild(el);
    this.toastService.show('Synonyms copied to clipboard');
  }

  /**
   * 
   */
  showCategory() {
    window.open(window.origin + '/crowdfunding/category/' + (this.currentName || ''));
  }
}
