import {PolymerElement, html} from '@polymer/polymer/polymer-element.js';
import {GestureEventListeners} from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import {addListener} from '@polymer/polymer/lib/utils/gestures.js';

import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
/**
### Quick Start
`file-drop-zone` is a wrapper around an invisible `file` input. The most basic use case is to style the `file-drop-zone` directly, and set the appropriate attributes (`required`, `accept`, `multiple`, `name`) for the `file` input.

```css
file-drop-zone {
  width: 200px;
  height: 200px;
  background-color: #fafafa;
}
```
```html
<file-drop-zone multiple accept="image/*" files="{{files}}"></file-drop-zone>
```

You can also customize the interior of the `file-drop-zone` via `slot` named `drop-zone`.

```html
<file-drop-zone multiple accept="image/*" files="{{files}}">
  <div slot="drop-zone">
    <iron-icon icon="description"></iron-icon>
    <h3>Drop your file here</h3>
  </div>
</file-drop-zone>
```

### Events
#### `change` or `selected`
Fired when one or more files are selected or dropped into the zone.
Return a [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) of selected files.
**Deprecation warning: `selected` event will be deprecated and removed at `2.1.0`. Use `change` event instead.**

#### `error`
Fired when an error is encountered.

### Installation
```
bower install --save PolymerVis/file-drop-zone
```

### Styling
You can style `file-drop-zone` normally, but there are 3 additional states available for styling.

**.dragover**
You can style `file-drop-zone` when a file is dragged over the drop-zone with the `dragover` class.

```css
file-drop-zone.dragover { border: 1px dashed grey; }
```

**.errored**
You can style `file-drop-zone` when there is any error with the `errored` class.

```css
file-drop-zone.errored { border: 1px dashed red; }
```

**[has-files]**
You can style `file-drop-zone` when there are at least 1 selected file with the `has-files` attribute.

```css
file-drop-zone[has-files] { border: 1px solid grey; }
```
* @customElement
* @polymer
* @demo demo/index.html
*/
class FileDropZone extends GestureEventListeners(PolymerElement) {
  static get template() {
    return html`
  <style include="iron-flex iron-flex-alignment">
    :host {
      display: block;
      box-sizing: border-box;
      cursor: pointer;
      @apply(--layout-vertical);
      @apply(--layout-center);
      @apply(--layout-center-justified);
    }
    #files {
      display: none;
    }
  </style>

  <input id="files" onclick="event.stopPropagation()" type="file" name\$="[[name]]" multiple\$="[[multiple]]" accept\$="[[accept]]" required\$="[[required]]" on-change="_onFilePick">

  <slot name="drop-zone"></slot>
`;
  }

  static get is() {
    return 'file-drop-zone';
  }
  /**
   * Fired when files are selected.
   *
   * @event selected
   * @param {FileList} fileList [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) of selected files.
   */
  /**
   * Fired when error is encountered.
   *
   * @event error
   * @param {ErrorEvent} error ErrorEvent
   */
  static get properties() {
    return {
      /**
       * Indicates if any files are selected.
       * @type {Boolean}
       */
      hasFiles: {
        type: Boolean,
        notify: true,
        readOnly: true,
        reflectToAttribute: true,
        computed: '_hasFiles(files)'
      },
      /**
       * Specifies that the user must fill in a value before submitting a form.
       * @type {Boolean}
       */
      required: {
        type: Boolean,
        reflectToAttribute: true
      },
      /**
       * Indicates if `file-drop-zone` can have more than one file selected.
       * @type {Boolean}
       */
      multiple: {
        type: Boolean,
        reflectToAttribute: true
      },
      /**
       * Indicate the types of files that the server accepts, otherwise it will
       * be ignored. The value must be a comma-separated list of unique content
       * type specifiers:
       * - A file extension starting with the STOP character (U+002E). (e.g. .jpg, .png, .doc).
       * - A valid MIME type with no extensions.
       * - audio/* representing sound files.
       * - video/* representing video files.
       * - image/* representing image files.
       *
       * @type {String}
       */
      accept: {
        type: String,
        reflectToAttribute: true
      },
      /**
       * The name of the control, which is submitted with the form data.
       * @type {String}
       */
      name: {
        type: String,
        reflectToAttribute: true
      },
      /**
       * An array of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File) currently selected.
       * @type {File[]}
       */
      files: {
        type: Array,
        notify: true,
        readOnly: true
      },
      /**
       * The most recent [File](https://developer.mozilla.org/en-US/docs/Web/API/File) selected.
       * @type {File}
       */
      lastFile: {
        type: Object,
        notify: true,
        readOnly: true,
        computed: '_getLastFile(files)'
      },
      /**
       * Number of Files selected.
       * @type {Number}
       */
      numFilesSelected: {
        type: Number,
        notify: true,
        readOnly: true,
        computed: '_getLen(files)'
      },
      /**
       * Last error event.
       * @type {{message: String}}
       */
      lastError: {
        type: Object,
        notify: true,
        readOnly: true,
        observer: '_lastErrorChanged'
      },
      /**
       * Event handler for change event for `input`.
       * @type {Function}
       */
      onchange: {
        type: Function,
        value: null,
        observer: '_onchangeChanged'
      }
    };
  }

  constructor() {
    super();
    this.addEventListener('dragover', e => this._onDragEvent(e));
    this.addEventListener('dragleave', e => this._onDragEvent(e));
    this.addEventListener('drop', e => this._onFileDrop(e));
    this.addEventListener('click',  e => { this.$.files.dispatchEvent(new MouseEvent('click'))});
  }

  _onchangeChanged(cb) {
    if (cb) this.$.files.onchange = cb;
  }

  _lastErrorChanged(error) {
    if (error) {
      this.classList.toggle('errored', true);
      this.dispatchEvent(error);
    } else {
      this.classList.toggle('errored', false);
    }
  }

  _validate(fileList) {
    if (!this.accept || this.accept.length === 0) return true;
    var acceptList = this.accept.split(',').map(s => s.trim().toLowerCase());
    if (acceptList.length === 0) return true;
    var hasAudio = acceptList.indexOf('audio/*') >= 0;
    var hasVideo = acceptList.indexOf('video/*') >= 0;
    var hasImage = acceptList.indexOf('image/*') >= 0;

    for (let i = 0, len = fileList.length; i < len; ++i) {
      let ext =
        '.' +
        fileList[i].name
          .split('.')
          .pop()
          .toLowerCase();
      if (acceptList.indexOf(ext) >= 0) continue;
      if (hasAudio && fileList[i].type.split('/')[0] === 'audio') continue;
      if (hasVideo && fileList[i].type.split('/')[0] === 'video') continue;
      if (hasImage && fileList[i].type.split('/')[0] === 'image') continue;
      if (acceptList.indexOf(fileList[i].type) >= 0) continue;

      // did not match anything in accept
      let message = `${
        fileList[i].name
      } has invalid file format not found in accept attribute!`;
      this._setLastError(new ErrorEvent('error', {message}));
      return false;
    }

    return true;
  }

  _getLastFile(files) {
    return files ? files[files.length - 1] : null;
  }

  _getLen(files) {
    return files ? files.length : 0;
  }

  _hasFiles(files) {
    return files && files.length > 0;
  }

  _onDragEvent(e) {
    e.stopPropagation();
    e.preventDefault();
    this.classList.toggle('dragover', e.type === 'dragover');
    e.dataTransfer.dropEffect = 'drop';
  }

  _onFilePick(e) {
    e.stopPropagation();
    e.preventDefault();
    this._setLastError(null);
    this._setFiles(this._toArray(e.target.files));
    this.dispatchEvent(new CustomEvent('selected', {detail: e.target.files}));
    this.dispatchEvent(new CustomEvent('change', {detail: e.target.files}));
    this.$.files.value = null;
  }

  _onFileDrop(e) {
    e.stopPropagation();
    e.preventDefault();
    this._setLastError(null);
    this.classList.toggle('dragover', false);
    var files = e.dataTransfer.files;

    if (!this.multiple && files.length > 1) {
      let message = `${
        files.length
      } files selected when multiple attribute is not present!`;
      this._setLastError(new ErrorEvent('error', {message}));
      return;
    }
    var ok = this._validate(files);
    if (ok) {
      this._setFiles(this._toArray(files));
      this.dispatchEvent(new CustomEvent('selected', {detail: files}));
      this.dispatchEvent(new CustomEvent('change', {detail: files}));
      this.$.files.value = null;
    }
  }

  _toArray(fileList) {
    var a = [];
    for (let i = 0, len = fileList.length; i < len; ++i) {
      a.push(fileList.item(i));
    }
    return a;
  }
}

window.customElements.define(FileDropZone.is, FileDropZone);
