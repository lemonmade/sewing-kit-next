import {createWebApp} from '@sewing-kit/config';

export default createWebApp((webApp) => {
  webApp.options({generateService: true});
});
