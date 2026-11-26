/*!
 * wcloud-lite - External Vendor Bundle Entry (build/vendor-app.js & build/vendor-app.css)
 * Bundles third-party npm packages:
 *   - bootstrap       : https://github.com/twbs/bootstrap
 *   - bootstrap-icons : https://github.com/twbs/icons
 *   - store           : https://github.com/marcuswestin/store.js
 *   - vanilla-picker  : https://github.com/Sphinxxxx/vanilla-picker
 *
 * Copyright (c) 2026 Idx
 * Released under the MIT license
 */

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'vanilla-picker/dist/vanilla-picker.csp.css';

import { Dropdown, Tab } from 'bootstrap';
import store from 'store/dist/store.modern.js';
import Picker from 'vanilla-picker/csp';

export { Dropdown, Tab, store, Picker };
