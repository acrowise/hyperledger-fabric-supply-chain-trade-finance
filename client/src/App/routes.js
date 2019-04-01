import {HomePage, LoginPage, SummaryPage, DealsPage} from '../_pages';

export const publicRoutes = [{
  component: HomePage,
  path: '/'
}, {
  component: LoginPage,
  path: '/login'
}, {
  component: DealsPage,
  path: '/deals'
}];

export const privateRoutes = [{
  component: SummaryPage,
  path: '/summary'
}];
