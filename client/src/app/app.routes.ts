import { Routes } from '@angular/router';
import { AdDetailPageComponent } from './features/ad-detail/ad-detail-page.component';
import { AdFormPageComponent } from './features/ad-form/ad-form-page.component';
import { BoardPageComponent } from './features/board/board-page.component';
import { MyAdsPageComponent } from './features/my-ads/my-ads-page.component';
import { NotFoundComponent } from './features/not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: BoardPageComponent, title: 'לוח מודעות שכונתי' },
  { path: 'my-ads', component: MyAdsPageComponent, title: 'המודעות שלי' },
  { path: 'ads/new', component: AdFormPageComponent, title: 'מודעה חדשה' },
  { path: 'ads/:id/edit', component: AdFormPageComponent, title: 'עריכת מודעה' },
  { path: 'ads/:id', component: AdDetailPageComponent, title: 'פרטי מודעה' },
  { path: '**', component: NotFoundComponent, title: 'עמוד לא נמצא' },
];
