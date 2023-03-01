import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { cloneDeep, intersection } from 'lodash';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss'],
})
export class HeaderMenuComponent implements OnInit {

  _menuList: any[] = [
    {
      label: 'GENERAL.REPORTS',
      link: '/reports',
      submenu: [
        {
          link: '/reports/funding',
          label: 'OTHERS.Funding',
          permission: ['funding'],
          submenu: [
            {
              link: '/reports/funding/campaign',
              label: 'OTHERS.Campaign',
            },
            {
              link: '/reports/funding/source',
              label: 'OTHERS.Source',
            },
            {
              link: '/reports/funding/category',
              label: 'OTHERS.Category',
            },
            {
              link: '/reports/funding/region',
              label: 'OTHERS.Region',
            },
            {
              link: '/reports/funding/location/data',
              label: 'OTHERS.Location'
            }
          ]
        },
        {
          link: '/reports/analytics',
          label: 'OTHERS.Analytics',
          permission: ['analytics'],
          submenu: [
            {
              link: '/reports/analytics/user',
              label: 'OTHERS.User'
            },
            {
              link: '/reports/analytics/home',
              label: 'OTHERS.Home'
            },
            {
              link: '/reports/analytics/advertisement',
              label: 'OTHERS.Advertisement',
            },
            {
              link: '/reports/analytics/category',
              label: 'OTHERS.Category',
            },
            {
              link: '/reports/analytics/campaign',
              label: 'OTHERS.Campaign',
            },
            {
              link: '/reports/analytics/source',
              label: 'OTHERS.Source',
            },
          ]
        }
      ]
    },
    {
      label: 'GENERAL.ADMIN',
      link: '/admin',
      submenu: [
        {
          link: '/admin/campaigns',
          label: 'OTHERS.Campaigns',
          permission: ['source']
        },
        {
          link: '/admin/companies',
          label: 'OTHERS.Companies',
          permission: ['company']
        },
        {
          link: '/admin/sources',
          label: 'OTHERS.Sources',
          permission: ['source']
        },
        {
          link: '/admin/aliases',
          label: 'OTHERS.Aliases',
          permission: ['alias']
        },
        {
          link: '/admin/user-management',
          label: 'OTHERS.user_manage',
          permission: ['user'],
          submenu: [
            {
              link: '/admin/user-management/users',
              label: 'OTHERS.Users'
            },
            {
              link: '/admin/user-management/roles',
              label: 'OTHERS.Roles'
            }
          ]
        },
        {
          link: '/admin/scraping',
          label: 'OTHERS.scrap_logs',
          permission: ['scraping']
        },
        {
          link: '/admin/backup-scraping',
          label: 'OTHERS.backup_scrap_logs',
          permission: ['scraping']
        },
        {
          link: '/admin/advertisement',
          label: 'OTHERS.Advertisement',
          permission: ['advertisement']
        }
      ]
    }
  ];
  menuList = [];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit(): void {
    this.menuList = cloneDeep(this._menuList);
    const recurse = (param) => {
      for (let i = 0 ; i < param.length; i++) {
        const itr = param[i];
        if (itr.permission && itr.permission.length && itr.permission.map( p => this.auth.hasPermission(p, 'readable').allowed).filter( el => !el).length) {
          param.splice(i, 1);
          i--;
        } else {
          if (itr.submenu) {
            recurse(itr.submenu);
            if (itr.submenu.length == 0) {
              param.splice(i, 1);
              i--;
            }
          }
        }
      }
    };
    recurse(this.menuList);
  }

  calculateMenuItemCssClass(url: string): string {
    return checkIsActive(this.router.url, url) ? 'here' : '';
  }
}

const getCurrentUrl = (pathname: string): string => pathname.split(/[?#]/)[0];

const checkIsActive = (pathname: string, url: string) => {
  const current = getCurrentUrl(pathname);
  if (!current || !url) {
    return false;
  }

  if (current === url) {
    return true;
  }

  if (current.indexOf(url) > -1) {
    return true;
  }

  return false;
};
