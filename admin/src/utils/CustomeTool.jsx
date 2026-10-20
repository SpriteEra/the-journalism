export default class CustomImageTool {
    constructor({ data }) {
      this.data = {
        url: data.url || '',
        caption: data.caption || '',
        alignment: data.alignment || 'center',
      };
      this.wrapper = null;
    }
  
    render() {
      this.wrapper = document.createElement('div');
      this.wrapper.classList.add('image-tool');
  
      const image = document.createElement('img');
      image.src = this.data.url;
      image.style.maxWidth = '100%';
  
      const caption = document.createElement('input');
      caption.placeholder = 'Caption';
      caption.value = this.data.caption;
      caption.addEventListener('input', (e) => {
        this.data.caption = e.target.value;
      });
  
      const alignments = ['left', 'center', 'right'];
      const alignmentBtns = alignments.map((align) => {
        const btn = document.createElement('button');
        btn.innerText = align;
        btn.addEventListener('click', () => {
          this.data.alignment = align;
          this.wrapper.style.textAlign = align;
        });
        return btn;
      });
  
      const toolbar = document.createElement('div');
      alignmentBtns.forEach((btn) => toolbar.appendChild(btn));
  
      this.wrapper.style.textAlign = this.data.alignment;
      this.wrapper.appendChild(image);
      this.wrapper.appendChild(caption);
      this.wrapper.appendChild(toolbar);
  
      return this.wrapper;
    }
  
    save() {
      return this.data;
    }
  
    static get toolbox() {
      return {
        title: 'Image',
        icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
      };
    }
  }
  