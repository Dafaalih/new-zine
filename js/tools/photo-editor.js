/**
 * PHOTO TO PIXEL ART — RETRO PHOTO EDITOR (photo-editor.js)
 * Transforms uploaded photos into artistic pixel art paper/lace cutouts with retro camera timestamps.
 */
(function () {
  'use strict';

const EMBEDDED_MASKS = {
  'roses': 'data:image/png;base64,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',
  'butterfly': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAAFQCAYAAAC2+amQAAAFzUlEQVR4nO3dQW7jMBAAQSvw/7+svCDwAlp6RHXVPRBNy2nwMjzO83wB0PMzvQAAZggAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABEvacXwHLnxb8//tM6mOH7509OAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUTvcB2Ce+eznt/+z7P+s88n77wQAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABB1nOfVcdcfLX/Azd16HvgXPHqe+j+of/6r/P9YyAkAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACDqPb2AgOl55sfmzz/jz6+/vyzkBAAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAEOU+gOerz7OvM8+fPzkBAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABEfeM+gCM+D3368+9+n8Cx+fpf8fVf5fe7kBMAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAEDUN+4DqNt9nnt9Hv9VPj+35QQAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABB1nKdx3R/YINjX7vcpLOUEABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQ9Z5ewAbME7/GfQrXeP9YxgkAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACDKfQD3V5+nfwzv3/Tzd//+3WdwY04AAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABR7gNYb3qeu3nss3bf/+n7DHbfv1tzAgCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKAEAiHIfwPPn+e8+j316/+v7N/3+Ta//0ZwAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACi3AfA0+f5TzPPnttyAgCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKAEAiHIfwPMdm8/zn17/9POn18+DOQEARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAES5D+D58+Cn1efRe3+uqb8/SzkBAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABEuQ/g+fPgrzKPfZb3h2WcAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAogQAIEoAAKIEACBKAACiBAAgSgAAotwHsN7VeezmqbPz++P9vzEnAIAoAQCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKAEAiBIAgCgBAIgSAIAoAQCIEgCAKPcBfGae+d7s/9777/e3kBMAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECUAABECQBAlAAARAkAQJQAAEQJAECU+wA+M08c5vj9LeQEABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIAECUAAFECABAlAABRAgAQJQAAUQIA8Gr6BY2VRL1KZ/hYAAAAAElFTkSuQmCC',
  'spiral_wave': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYIAAACoCAYAAADtuultAAAELUlEQVR4nO3dQW7cNgBAUanI/a/MIpuu0iAqSonkf2+bQawhKX9obNL3GOMCoOuvry8AgG8JAUCcEADECQFAnBAAxAkBQJwQAMQJAUCcEADECQFAnBAAxAkBQJwQAMQJAUCcEADECQFAnBAAxAkBQJwQAMQJAUCcEADECQFAnBAAxP24GsbXF3Cw++sL4DH3wzP3dThPBABxQgAQJwQAcUIAECcEAHFCABAnBABxQgAQJwQAcUIALXYVc9QRExb0fvNw/Fb9A++HU+fsyXiN08fLEwFAnBAAxAkBQJwQAMQJAUCcEADECQFAnBAAxAkBQJwQ/LfdgVvuHgQeua+Ie4ylTmpY4WJ2mvwVxmsFO83ZE46NWMM4fR48EQDECQHA+5Z5GvhJCADihAAgTggA4r/oIQQAcUIAECcEAO/zW0MAceOK/fH6sUj97t0mZ8L7OnUMdluL9bHdcR7uk++dN46YWGFwdlt0X1thzr62wppZ4WiDr9fCCvNwfTxe08fAR0MAcUIAECcEAHFCABAnBABxQgAQJwQAcUIAECcEAHFvHDEx04nbvmds1X9yxMST1518dMWTsd1t9+uf2m3OTh2vMXuN7XzEhJtvnvvg9zbDbuPliIl5xoT/0xETQbstfGBzQgAQJwQAcUIAECcEAHFCABAnBABxQgAQJwTr+XoDDxBjZ/E7dvzmfv/iCIlxwK7aN8brd/+2y3j97v28yX3+wjh4InjHTov5V4t6LPJNYWW/G58dx27Haz71Pr+vyYQAIE4IAOKEACBOCADihAAgTggA4oQAIE4IAOKEACDux9cXELHCLs1Zf7B8TLqGe6OxfcJ47bnT/ks/58wREwew8Ocxts8Yr/3cs7+AEADECQFAnBAAxAkBQJwQAMQJAUCcEADECQFAnBCwuxV2ysLWa9wRE+xu1tEZK5h1vXYXPzM+/vp2FgMwlxAAxAkBQJwQAMQJAUCcEADECQFAnBAAxAkBJTZSwS8IASVf7xCFJdftPcZS94Yt9WswD88sdRN9aKf5XWHO7msRngiAo76pbeK+FiIEAHFCAND8aOofQgDwPh8NAcSNayFCABAnBABxQgDwPj8jAGAdQgAc98PPDYxrIasdMfGEYxCeMV772fbmDLuvDXkiAIgTAoA4IQCIEwKAOCEAiBMCgDghAIgTAoA4IQCIE4J3dn2u8FqA446YeCLxJuvb5OOs8Xnu63CeCADihAAgTggA4oQAIE4IAOKEACBOCADihAAgTggA4n5cHfeD3ZkzXvunuxPHAtfKfv7v9bXCa2ev8V3uhzF7d3PliAkA/oWPhgDihAAgTggA4oQAIE4IAOKEACBOCADihAAgTggA4oQAIE4IAOKEACBOCADihAAgTggA4oQAIE4IAOKEACBOCADihAAgTggA4oQAIE4IAK62vwE5I4gzTfGslAAAAABJRU5ErkJggg==',
  'snowflake1': 'data:image/png;base64,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',
  'ornament': 'data:image/png;base64,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',
  'snowflake2': 'data:image/png;base64,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',
  'hare': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAdQAAAGYCAYAAAD7vRN7AAAG9UlEQVR4nO3XQY7bMBAAQTLg/7/MnPKAzbYhyqy6e0Cbshoz994DAPidP7/8PAAgqADQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAisYgjwtfY423z6APCPDRUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgMAqhgDH2OMu9fed8TwuYkMFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASCwiiHAMWY8b4+77MPvg4PZUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACKxiCK+yx9nm0wcA+B82VAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAnPvXczhc1wQPzHHXW77f9x2v69iQwWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABILCKIXzUjOfteB5n2Zc9z7ep79d9hGyoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEVjGEj9pPHwBCtz3P8/Dfbx/+fV/FhgoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQGAVQ15uP30A4Gt5v1zEhgoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQGAVQwB4pfn0Ab6JDRUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgMAqhkBojrvspw/A1ernb46L2VABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAis8T573GU+fQA+yv1+t9veV/vm/4cNFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAwCqGvNx8+gDA16rfL3ucbY6L2VABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAis8T7z6QMAPMT772A2VAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQACggoAAUEFgICgAkBAUAEgIKgAEBBUAAgIKgAEBBUAAoIKAAFBBYCAoAJAQFABICCoABAQVAAICCoABAQVAAKCCgABQQWAgKACQEBQASAgqAAQEFQACAgqAAQEFQDG7/0FrlEgQU6LaSUAAAAASUVORK5CYII=',
};

  const FRAMES = [
    {
      id: 'roses',
      name: 'Rose Bouquet (Mawar)',
      icon: '🌹',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c2-2 5-1 5 2 0 4-5 6-5 6s-5-2-5-6c0-3 3-4 5-2z"/><path d="M12 12v9"/><path d="M12 15c-2.5 0-4-1.5-4-3"/><path d="M12 17c2.5 0 4-1.5 4-3"/></svg>'
    },
    {
      id: 'butterfly',
      name: 'Pixel Butterfly',
      icon: '🦋',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M12 6c-4-4-9-2-9 4 0 5 4 7 9 2"/><path d="M12 6c4-4 9-2 9 4 0 5-4 7-9 2"/><path d="M12 15c-3 3-6 3-7 1"/><path d="M12 15c3 3 6 3 7 1"/></svg>'
    },
    {
      id: 'spiral_wave',
      name: 'Spiral Wave',
      icon: '🌀',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12a2 2 0 1 0 2 2"/><path d="M12 8a6 6 0 1 0 6 6"/><path d="M12 4a10 10 0 1 0 10 10"/></svg>'
    },
    {
      id: 'snowflake1',
      name: 'Snowflake 1 (Salju)',
      icon: '❄️',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="5" y1="5" x2="19" y2="19"/><line x1="5" y1="19" x2="19" y2="5"/><circle cx="12" cy="12" r="2.2"/></svg>'
    },
    {
      id: 'ornament',
      name: 'Vintage Filigree',
      icon: '⚜️',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1.5 3 4 5 4 8a4 4 0 0 1-8 0c0-3 2.5-5 4-8z"/><path d="M6 14c-2 0-3-1-3-3 0-3 3-5 6-4"/><path d="M18 14c2 0 3-1 3-3 0-3-3-5-6-4"/><path d="M9 19h6"/><path d="M12 19v3"/></svg>'
    },
    {
      id: 'snowflake2',
      name: 'Pixel Starburst',
      icon: '✳️',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"/></svg>'
    },
    {
      id: 'hare',
      name: 'Leaping Hare',
      icon: '🐇',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5 0 2.5-1 2.5-2.5 0-1.5-1.5-2.5-3-2.5-1 0-1.8.5-2.2 1.3L15 6c-.4-1.8-1.5-3.5-2.8-3.5s-1.8 1.5-1 3.5l1.2 2.8c-1.8.8-2.9 2-2.9 3.7 0 2.8 2.2 5 5.5 5 3 0 4-1.5 4-3.5z"/><circle cx="17.5" cy="11.5" r="0.75" fill="currentColor"/></svg>'
    },
    {
      id: 'mosaic',
      name: 'Full Mosaic',
      isFull: true,
      icon: '▦',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
    }
  ];

  const PAPERS = [
    { id: 'lace', name: 'White Lace (Renda)', src: 'assets/sample/lace_clean.jpg', bg: '#f6f6f9', isLace: true },
    { id: 'aida', name: 'Aida Cloth (Kain Kristik)', bg: '#f5f1e6', isAida: true },
    { id: 'folded', name: 'Folded Paper', bg: '#fbf9f4' },
    { id: 'wrinkled', name: 'Wrinkled Paper', src: 'assets/overlay/Texturelabs_Paper_128M.jpg', bg: '#f5f2eb' },
    { id: 'watercolor', name: 'Watercolor Paper', bg: '#f7f6f2', isWatercolor: true },
    { id: 'washi', name: 'Washi Fiber Paper', bg: '#faf8f2', isWashi: true },
    { id: 'newsprint', name: 'Halftone Newsprint', bg: '#edebe4', isNewsprint: true },
    { id: 'linen', name: 'Linen Fabric', bg: '#f3f2ee', isLinen: true },
    { id: 'darkcard', name: 'Dark Charcoal Card', bg: '#1c1c20', isDarkCard: true },
    { id: 'kraft', name: 'Vintage Kraft', bg: '#d7c4a7' },
    { id: 'grid', name: 'Notebook Grid', bg: '#ffffff' },
    { id: 'clean', name: 'Minimal White', bg: '#ffffff' }
  ];

  const SAMPLES = {
    gig: 'assets/sample/gig_crowd.jpg',
    croissant: 'assets/sample/gig_crowd.jpg',
    cat: 'assets/sample/cat_orig.jpg',
    horse: 'assets/sample/horse_orig.jpg',
    sunset: 'assets/sample/sunset_orig.jpg'
  };

  const CARD_RATIOS = {
    '4:5': { id: '4:5', name: '4:5 (Portrait)', W: 640, H: 400, totalH: 800, cssAspect: '4 / 5', maxW: '360px' },
    '1:1': { id: '1:1', name: '1:1 (Square)', W: 600, H: 300, totalH: 600, cssAspect: '1 / 1', maxW: '380px' },
    '9:16': { id: '9:16', name: '9:16 (Story)', W: 540, H: 480, totalH: 960, cssAspect: '9 / 16', maxW: '290px' },
    '16:9': { id: '16:9', name: '16:9 (Wide)', W: 800, H: 225, totalH: 450, cssAspect: '16 / 9', maxW: '520px' },
    '4:3': { id: '4:3', name: '4:3 (Classic)', W: 640, H: 240, totalH: 480, cssAspect: '4 / 3', maxW: '460px' }
  };

  const state = {
    ratio: '4:5',
    activeFrame: 'roses',
    activePaper: 'lace',
    customColor: null, // Custom paper background tint if selected
    effectType: 'pixel', // 'pixel' | 'cross-stitch'
    stitchSize: 10, // 6..26px stitch grid size
    showAidaCloth: true, // Aida grid pinholes & cloth weave under stitches
    stitchApplyTop: false, // Apply stitch effect to top photo
    pixelSize: 0, // 0 = crisp original photo cutout (no pixelation, as requested)
    dreamy: 0, // 0 = off, 1..100 = dreamy glow bloom
    brightness: 0,
    contrast: 15,
    mood: 'original',
    invert: false,
    stencilScale: 1.0,
    stencilOffsetX: 0,
    stencilOffsetY: 0,
    showTimestamp: false, // In croissant example, timestamp is optional
    timestampText: '29.10 · 10:29',
    showStamp: false,
    stampText: 'wish',
    order: 'photo-top', // 'photo-top' matches user reference: photo on top, cutout on bottom
    viewMode: 'split', // 'split' | 'art' | 'photo'
    splitDir: 'vertical', // 'vertical' (atas-bawah) | 'horizontal' (kanan-kiri)
    currentImage: null,
    maskImages: {},
    paperImages: {},
    initialized: false,
    editorMode: 'pixel', // 'pixel' | 'emboss'
    emboss: {
      material: 'blue_linen',
      materialBg: '#1c3453',
      customColor: null,
      grain: 65,
      motif: 'ribbon_flame',
      customText: 'ORGANIC EMBOSS',
      showText: true,
      customGraphicImg: null,
      reliefType: 'deboss', // 'deboss' | 'emboss'
      depth: 4,
      light: 'top-left',
      foil: 'blind',
      ratio: '4:5'
    },
    embossMaterialImages: {}
  };

  const EMBOSS_MATERIALS = [
    { id: 'blue_linen', name: 'Blue Bookcloth Linen', src: 'assets/sample/emboss_blue_linen.jpg', bg: '#1c3453', isFabric: true },
    { id: 'magenta_felt', name: 'Magenta Velvet Felt', src: 'assets/sample/emboss_magenta_felt.jpg', bg: '#6e113c', isFabric: true },
    { id: 'cotton_paper', name: 'Warm Cotton Paper', bg: '#f4efe6', isPaper: true },
    { id: 'obsidian_leather', name: 'Obsidian Leather', bg: '#161619', isLeather: true },
    { id: 'sage_green', name: 'Sage Green Cardstock', bg: '#2d4033', isPaper: true },
    { id: 'terracotta', name: 'Terracotta Matte', bg: '#9c4533', isPaper: true }
  ];

  const EMBOSS_COLOR_SWATCHES = [
    { name: 'Navy Blue', color: '#182a44' },
    { name: 'Magenta Rose', color: '#741541' },
    { name: 'Forest Green', color: '#1a3427' },
    { name: 'Obsidian Dark', color: '#18181c' },
    { name: 'Warm Cotton', color: '#ebe4d8' },
    { name: 'Terracotta', color: '#a04835' },
    { name: 'Deep Royal', color: '#1a1d36' },
    { name: 'Paper White', color: '#f7f6f2' }
  ];

  const EMBOSS_MOTIFS = [
    {
      id: 'ribbon_flame',
      name: 'Organic Ribbon Flame',
      icon: '🔥',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c-2 4-6 6-6 10a6 6 0 0 0 12 0c0-3-2-6-4-8-1 2-2 3-2 3s1-3 0-5z"/></svg>'
    },
    {
      id: 'butterfly_botanical',
      name: 'Butterfly & Stars',
      icon: '🦋',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M12 6c-4-4-9-2-9 4 0 5 4 7 9 2"/><path d="M12 6c4-4 9-2 9 4 0 5-4 7-9 2"/></svg>'
    },
    {
      id: 'rose_filigree',
      name: 'Botanical Rose',
      icon: '🌹',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4c2-2 5-1 5 2 0 4-5 6-5 6s-5-2-5-6c0-3 3-4 5-2z"/><path d="M12 12v9"/></svg>'
    },
    {
      id: 'celestial_geometry',
      name: 'Celestial Starburst',
      icon: '✦',
      iconSvg: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9 12 2"/></svg>'
    }
  ];

  let cvPhoto = null;
  let cvArt = null;
  let cardEl = null;
  let stageEl = null;
  let cvEmboss = null;
  let embossCardEl = null;
  let embossStageEl = null;

  function init() {
    cvPhoto = document.getElementById('canvas-original-stencil');
    cvArt = document.getElementById('canvas-pixel-art');
    cardEl = document.getElementById('photo-card');
    stageEl = document.getElementById('photo-card-stage');

    cvEmboss = document.getElementById('canvas-emboss');
    embossCardEl = document.getElementById('emboss-card');
    embossStageEl = document.getElementById('emboss-card-stage');

    if (!cvPhoto || !cvArt) return;

    if (!state.currentImage) {
      state.currentImage = createDefaultCroissantImage();
    }

    if (!state.initialized) {
      FRAMES.forEach(f => {
        if (!f.isProcedural && !f.isFull) loadMaskImage(f);
      });
      loadEmbossMaterials();
      bindEvents();
      buildFrameList();
      buildPaperList();
      buildEmbossMaterialList();
      buildEmbossColorSwatches();
      buildEmbossMotifList();
      render();
      renderEmboss();
      loadSamplePhoto(SAMPLES.gig);
      state.initialized = true;
    } else {
      render();
      renderEmboss();
    }
  }

  function createDefaultCroissantImage() {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 400;
    const ctx = c.getContext('2d');
    
    // Warm bakery wooden table
    ctx.fillStyle = '#cf9d67';
    ctx.fillRect(0, 0, 640, 400);

    // Ceramic plate
    ctx.fillStyle = '#faf8f5';
    ctx.beginPath();
    ctx.ellipse(320, 200, 260, 160, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2ded5';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Golden croissant
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(320, 190, 100, 0.2 * Math.PI, 0.8 * Math.PI, true);
    ctx.fill();

    // Glaze & pastry layers
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(320, 180, 80, 0.2 * Math.PI, 0.8 * Math.PI, true);
    ctx.fill();

    return c;
  }

  function loadSamplePhoto(url) {
    const img = new Image();
    img.onload = () => {
      state.currentImage = img;
      render();
    };
    img.src = url;
  }

  function loadPhotoFromFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        state.currentImage = img;
        render();
        if (window.toast) window.toast('foto berhasil diunggah!');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* ============================================================
     RENDER PIPELINE
     ============================================================ */
  function render() {
    if (!state.currentImage || !cvPhoto || !cvArt) return;

    const rConfig = CARD_RATIOS[state.ratio] || CARD_RATIOS['4:5'];
    const isSplit = state.viewMode === 'split';
    const isHorizontal = isSplit && state.splitDir === 'horizontal';

    let W, H;
    if (!isSplit) {
      W = rConfig.W;
      H = rConfig.totalH;
    } else if (isHorizontal) {
      W = Math.round(rConfig.W / 2);
      H = rConfig.totalH;
    } else {
      // vertical split (atas-bawah)
      W = rConfig.W;
      H = rConfig.H;
    }

    const cardEl = document.getElementById('photo-card');
    if (cardEl) {
      cardEl.style.setProperty('--card-aspect', rConfig.cssAspect);
      cardEl.style.setProperty('--card-max-w', rConfig.maxW);
      cardEl.classList.toggle('split-horizontal', isHorizontal);
    }

    cvPhoto.width = W;
    cvPhoto.height = H;
    cvArt.width = W;
    cvArt.height = H;

    // 1. Photo with white stencil outline (TOP in vertical, LEFT in horizontal)
    renderPhotoWithStencil(cvPhoto, W, H);

    // 2. Textured background with pixel cutout (BOTTOM in vertical, RIGHT in horizontal)
    renderPixelArtCutout(cvArt, W, H);

    updateDOMOverlays();
  }

  // 1. Photo with white stencil (matches TOP of user example)
  function renderPhotoWithStencil(canvas, W, H) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Draw user photo (or cross-stitch if stitchApplyTop is active)
    if (state.effectType === 'cross-stitch' && state.stitchApplyTop) {
      renderCrossStitchCanvas(ctx, W, H, state.stitchSize, state.showAidaCloth);
    } else {
      applyFilters(ctx, state.brightness, state.contrast, state.mood);
      drawImageCover(ctx, state.currentImage, 0, 0, W, H);
      if (state.dreamy > 0) {
        applyDreamyGlow(ctx, state.currentImage, 0, 0, W, H, state.dreamy);
      }
    }

    // Reset filter for stencil
    ctx.filter = 'none';

    // 1. Offscreen Paper Canvas (full textured paper with chosen color)
    const paperCv = document.createElement('canvas');
    paperCv.width = W;
    paperCv.height = H;
    const paperCtx = paperCv.getContext('2d');
    drawPaperBackground(paperCtx, W, H, state.activePaper);

    // 2. Stencil Cutout Canvas
    const stencilCv = document.createElement('canvas');
    stencilCv.width = W;
    stencilCv.height = H;
    const sCtx = stencilCv.getContext('2d');
    drawMaskShape(sCtx, W, H, state.activeFrame, state.invert);

    // 3. Composite paper onto the mask shape in a single drawImage with source-in
    sCtx.globalCompositeOperation = 'source-in';
    sCtx.drawImage(paperCv, 0, 0);

    // 4. Composite paper stencil onto photo with subtle drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    ctx.drawImage(stencilCv, 0, 0);
    ctx.restore();
  }

  // 2. Textured background with stencil cutout (matches user example: crisp photo cutout, NOT pixelated)
  function renderPixelArtCutout(canvas, W, H) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // 1. Draw base textured background (Lace fabric or paper)
    drawPaperBackground(ctx, W, H, state.activePaper);

    // 2. Photo buffer: Clean, crisp original photo with filters applied (matching top half)
    const photoBuffer = document.createElement('canvas');
    photoBuffer.width = W;
    photoBuffer.height = H;
    const pCtx = photoBuffer.getContext('2d');

    if (state.effectType === 'cross-stitch') {
      // Cross-stitch embroidery effect
      renderCrossStitchCanvas(pCtx, W, H, state.stitchSize, state.showAidaCloth);
    } else if (state.pixelSize && state.pixelSize > 1) {
      // Optional pixelation if user manually increases the slider
      const pixelSize = Math.max(2, state.pixelSize);
      const lowW = Math.max(1, Math.round(W / pixelSize));
      const lowH = Math.max(1, Math.round(H / pixelSize));
      const off = document.createElement('canvas');
      off.width = lowW;
      off.height = lowH;
      const offCtx = off.getContext('2d');
      applyFilters(offCtx, state.brightness, state.contrast, state.mood);
      drawImageCover(offCtx, state.currentImage, 0, 0, lowW, lowH);
      if (state.dreamy > 0) {
        applyDreamyGlow(offCtx, state.currentImage, 0, 0, lowW, lowH, state.dreamy);
      }

      pCtx.imageSmoothingEnabled = false;
      pCtx.drawImage(off, 0, 0, W, H);
    } else {
      // Default: 100% crisp, original photo cutout matching the top photo
      applyFilters(pCtx, state.brightness, state.contrast, state.mood);
      drawImageCover(pCtx, state.currentImage, 0, 0, W, H);
      if (state.dreamy > 0) {
        applyDreamyGlow(pCtx, state.currentImage, 0, 0, W, H, state.dreamy);
      }
    }

    // 3. Stencil Mask
    const maskCv = document.createElement('canvas');
    maskCv.width = W;
    maskCv.height = H;
    const maskCtx = maskCv.getContext('2d');
    drawMaskShape(maskCtx, W, H, state.activeFrame, state.invert);

    // 4. Cutout buffer: photo clipped inside stencil
    const cutoutCv = document.createElement('canvas');
    cutoutCv.width = W;
    cutoutCv.height = H;
    const cCtx = cutoutCv.getContext('2d');

    cCtx.drawImage(maskCv, 0, 0);
    cCtx.globalCompositeOperation = 'source-in';
    cCtx.drawImage(photoBuffer, 0, 0);

    // 5. Draw cutout onto textured background with realistic tactile shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.drawImage(cutoutCv, 0, 0);
    ctx.restore();
  }

  /* ============================================================
     CROSS-STITCH EFFECT RENDERER (KRISTIK / TUSUK SILANG)
     Transforms photos into authentic embroidery with 3D thread highlights
     ============================================================ */
  function renderCrossStitchCanvas(ctx, W, H, stitchSize, showAida) {
    if (!state.currentImage) return;

    const s = Math.max(6, Math.min(36, stitchSize || 10));

    // 1. Offscreen source canvas with filters & glow applied
    const srcCv = document.createElement('canvas');
    srcCv.width = W;
    srcCv.height = H;
    const sCtx = srcCv.getContext('2d');
    applyFilters(sCtx, state.brightness, state.contrast, state.mood);
    drawImageCover(sCtx, state.currentImage, 0, 0, W, H);
    if (state.dreamy > 0) {
      applyDreamyGlow(sCtx, state.currentImage, 0, 0, W, H, state.dreamy);
    }

    const imgData = sCtx.getImageData(0, 0, W, H).data;

    // 2. Clear target canvas
    ctx.clearRect(0, 0, W, H);

    // 3. Aida Cloth Fabric Base (natural counted-stitch cloth texture)
    if (showAida) {
      ctx.fillStyle = '#f7f4ed';
      ctx.fillRect(0, 0, W, H);

      // Fine woven grain lines
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = 'rgba(170, 150, 125, 0.2)';
      ctx.beginPath();
      for (let x = 0; x <= W; x += s) {
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
      }
      for (let y = 0; y <= H; y += s) {
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();

      // Realistic puncture holes at grid intersections
      ctx.fillStyle = 'rgba(50, 40, 30, 0.35)';
      const holeRad = Math.max(0.9, s * 0.08);
      ctx.beginPath();
      for (let y = 0; y <= H; y += s) {
        for (let x = 0; x <= W; x += s) {
          ctx.moveTo(x + holeRad, y);
          ctx.arc(x, y, holeRad, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }

    // 4. Stitches Geometry & Parameters
    const pad = Math.max(1, Math.round(s * 0.12));
    const lw = Math.max(1.8, Math.round(s * 0.32));
    const hlW = Math.max(0.7, lw * 0.35);

    const cols = Math.ceil(W / s);
    const rows = Math.ceil(H / s);

    // Pass 1: Soft drop shadow under all stitches for physical depth
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = lw + 1;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const y = r * s;
      const cy = Math.min(H - 1, y + Math.floor(s / 2));
      for (let c = 0; c < cols; c++) {
        const x = c * s;
        const cx = Math.min(W - 1, x + Math.floor(s / 2));
        const idx = (cy * W + cx) * 4;
        if (imgData[idx + 3] < 15) continue;

        const x1 = x + pad + 0.8;
        const y1 = y + pad + 1.2;
        const x2 = x + s - pad + 0.8;
        const y2 = y + s - pad + 1.2;

        ctx.moveTo(x1, y2);
        ctx.lineTo(x2, y1);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Pass 2: Base Thread Stitches (Leg 1 under, center crossover shadow, Leg 2 over)
    ctx.save();
    ctx.lineCap = 'round';

    for (let r = 0; r < rows; r++) {
      const y = r * s;
      const cy = Math.min(H - 1, y + Math.floor(s / 2));
      for (let c = 0; c < cols; c++) {
        const x = c * s;
        const cx = Math.min(W - 1, x + Math.floor(s / 2));
        const idx = (cy * W + cx) * 4;
        const a = imgData[idx + 3];
        if (a < 15) continue;

        const cr = imgData[idx];
        const cg = imgData[idx + 1];
        const cb = imgData[idx + 2];

        const x1 = x + pad;
        const y1 = y + pad;
        const x2 = x + s - pad;
        const y2 = y + s - pad;

        // Leg 1 (Under-stitch: bottom-left to top-right /)
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x1, y2);
        ctx.lineTo(x2, y1);
        ctx.stroke();

        // Tiny shadow dot where Leg 2 crosses over Leg 1 at center
        const mx = x + s / 2;
        const my = y + s / 2;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.arc(mx, my, lw * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Leg 2 (Over-stitch: top-left to bottom-right \)
        ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Pass 3: Silk / Mercerized Cotton Fiber Highlights (Single batched stroke for high FPS)
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
    ctx.lineWidth = hlW;
    ctx.beginPath();
    for (let r = 0; r < rows; r++) {
      const y = r * s;
      const cy = Math.min(H - 1, y + Math.floor(s / 2));
      for (let c = 0; c < cols; c++) {
        const x = c * s;
        const cx = Math.min(W - 1, x + Math.floor(s / 2));
        const idx = (cy * W + cx) * 4;
        if (imgData[idx + 3] < 15) continue;

        const x1 = x + pad;
        const y1 = y + pad;
        const x2 = x + s - pad;
        const y2 = y + s - pad;

        ctx.moveTo(x1, y2);
        ctx.lineTo(x2, y1);
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  /* ============================================================
     PAPER & LACE BACKGROUND GENERATION
     ============================================================ */
  function drawPaperBackground(ctx, W, H, paperId) {
    const p = PAPERS.find(x => x.id === paperId) || PAPERS[0];
    const baseColor = state.customColor || p.bg || '#fbf9f4';

    if (p.isLace) {
      drawLaceFabric(ctx, W, H, baseColor);
      return;
    }

    ctx.save();
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, W, H);

    // Dynamic contrast factor for dark vs light custom color
    const isDarkBg = isColorDark(baseColor);

    if (p.isWatercolor) {
      // Textured stippling & soft wash bleeds
      ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.035)';
      for (let i = 0; i < 3500; i++) {
        const rad = Math.random() < 0.2 ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // Soft uneven wash splotches
      for (let s = 0; s < 12; s++) {
        const rx = Math.random() * W;
        const ry = Math.random() * H;
        const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, 70);
        grad.addColorStop(0, isDarkBg ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, 70, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p.isWashi) {
      // Long organic mulberry fibers running across the paper
      ctx.lineWidth = 1;
      for (let i = 0; i < 450; i++) {
        const fx = Math.random() * W;
        const fy = Math.random() * H;
        const len = 12 + Math.random() * 28;
        const ang = (Math.random() - 0.5) * 1.2;
        ctx.strokeStyle = isDarkBg
          ? (Math.random() < 0.6 ? 'rgba(255, 255, 255, 0.12)' : 'rgba(220, 210, 190, 0.08)')
          : (Math.random() < 0.6 ? 'rgba(255, 255, 255, 0.7)' : 'rgba(160, 140, 110, 0.18)');
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.quadraticCurveTo(fx + len * 0.5, fy + (Math.random() - 0.5) * 8, fx + Math.cos(ang) * len, fy + Math.sin(ang) * len);
        ctx.stroke();
      }
    } else if (p.isNewsprint) {
      // Retro halftone newsprint screen
      ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
      const step = 6;
      for (let y = 0; y < H; y += step) {
        const offset = (Math.floor(y / step) % 2) * (step / 2);
        for (let x = 0; x < W; x += step) {
          ctx.beginPath();
          ctx.arc(x + offset, y, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Newsprint pulp fibers
      ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.03)' : 'rgba(60, 40, 20, 0.04)';
      for (let i = 0; i < 800; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      }
    } else if (p.isAida) {
      // Authentic Aida cloth weave for cross-stitch:
      // Even-weave fabric with distinct thread bands and puncture holes
      const aidaStep = 10;
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = isDarkBg ? 'rgba(255, 255, 255, 0.08)' : 'rgba(180, 165, 140, 0.28)';
      for (let x = 0; x <= W; x += aidaStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += aidaStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Puncture holes at intersections
      ctx.fillStyle = isDarkBg ? 'rgba(0, 0, 0, 0.6)' : 'rgba(80, 65, 50, 0.35)';
      for (let y = 0; y <= H; y += aidaStep) {
        for (let x = 0; x <= W; x += aidaStep) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Fabric texture flecks
      ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 500; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      }
    } else if (p.isLinen) {
      // Cross-weave linen fabric warp & weft threads
      const threadStep = 4;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = isDarkBg ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
      for (let x = 0; x < W; x += threadStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += threadStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Slub irregularities
      ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)';
      for (let i = 0; i < 400; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 6 + 2, 1);
      }
    } else if (p.isDarkCard) {
      // Dense cardstock tooth with subtle flecks
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < 3000; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
      }
      ctx.fillStyle = 'rgba(255, 215, 0, 0.04)';
      for (let i = 0; i < 300; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
      }
    } else if (paperId === 'grid') {
      ctx.strokeStyle = isDarkBg ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 100, 255, 0.08)';
      ctx.lineWidth = 1;
      const step = 20;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
    } else if (paperId === 'kraft') {
      ctx.fillStyle = 'rgba(120, 70, 30, 0.06)';
      for (let i = 0; i < 800; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
      }
    } else if (paperId === 'folded') {
      // Horizontal subtle crease
      ctx.strokeStyle = isDarkBg ? 'rgba(0, 0, 0, 0.35)' : 'rgba(0, 0, 0, 0.07)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, H * 0.48); ctx.lineTo(W, H * 0.48); ctx.stroke();
      ctx.strokeStyle = isDarkBg ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath(); ctx.moveTo(0, H * 0.48 + 1); ctx.lineTo(W, H * 0.48 + 1); ctx.stroke();
    }

    // Universal paper grain
    ctx.fillStyle = isDarkBg ? 'rgba(255, 255, 255, 0.025)' : 'rgba(0, 0, 0, 0.025)';
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() < 0.3 ? 2 : 1, 1);
    }

    ctx.restore();
  }

  function isColorDark(hexColor) {
    if (!hexColor || typeof hexColor !== 'string') return false;
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
  }

  // Authentic delicate white floral lace fabric texture (matches user example)
  function drawLaceFabric(ctx, W, H, baseColor) {
    ctx.save();
    ctx.fillStyle = baseColor || '#f5f5f9';
    ctx.fillRect(0, 0, W, H);

    const isDark = isColorDark(baseColor || '#f5f5f9');

    // Fine mesh grid
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(210, 210, 225, 0.35)';
    ctx.lineWidth = 0.8;
    const mesh = 10;
    for (let x = 0; x < W; x += mesh) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += mesh) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Scalloped floral lace motifs
    ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.6;
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.4)';

    const flowerStep = 48;
    for (let x = 16; x < W + flowerStep; x += flowerStep) {
      for (let y = 16; y < H + flowerStep; y += flowerStep) {
        // Center ring
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 6 petals
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          const px = x + Math.cos(a) * 14;
          const py = y + Math.sin(a) * 14;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Soft lace embroidery grain
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(180, 180, 200, 0.08)';
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5);
    }
    ctx.restore();
  }

  /* ============================================================
     MASK SHAPE GENERATION
     ============================================================ */
  function drawMaskShape(ctx, W, H, frameId, invert) {
    const frame = FRAMES.find(f => f.id === frameId) || FRAMES[0];

    if (frame.isFull) {
      if (!invert) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);
      }
      return;
    }

    const scaleMult = state.stencilScale || 1.0;
    const offX = state.stencilOffsetX || 0;
    const offY = state.stencilOffsetY || 0;

    if (frame.isProcedural) {
      drawProceduralShape(ctx, W, H, frame.id, scaleMult, offX, offY);
    } else if (state.maskImages[frame.id]) {
      const img = state.maskImages[frame.id];
      const baseScale = Math.min((W * 0.78) / img.width, (H * 0.78) / img.height);
      const scale = baseScale * scaleMult;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2 + offX;
      const dy = (H - dh) / 2 + offY;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      loadMaskImage(frame, () => render());
      drawProceduralShape(ctx, W, H, 'bow', scaleMult, offX, offY);
    }

    if (invert) {
      ctx.globalCompositeOperation = 'xor';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function loadMaskImage(frame, callback) {
    if (state.maskImages[frame.id]) {
      if (callback) callback();
      return;
    }
    const src = (typeof EMBEDDED_MASKS !== 'undefined' && EMBEDDED_MASKS[frame.id]) ? EMBEDDED_MASKS[frame.id] : frame.src;
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      state.maskImages[frame.id] = img;
      if (callback) callback();
    };
    img.src = src;
  }

  function drawProceduralShape(ctx, W, H, type, scale = 1, offX = 0, offY = 0) {
    ctx.fillStyle = '#ffffff';
    const cx = W / 2 + offX;
    const cy = H / 2 + offY;
    const bs = (type === 'heart' ? 20 : 14) * scale;

    function pBlock(x, y, w = 1, h = 1) {
      ctx.fillRect(cx + x * bs, cy + y * bs, w * bs, h * bs);
    }

    if (type === 'bow') {
      // Pixel bow ribbon
      // Center knot
      pBlock(-1, -1, 2, 2);
      // Left loop
      pBlock(-5, -4, 4, 1); pBlock(-6, -3, 2, 3); pBlock(-4, -1, 3, 1); pBlock(-3, 0, 2, 1);
      // Right loop
      pBlock(1, -4, 4, 1); pBlock(4, -3, 2, 3); pBlock(1, -1, 3, 1); pBlock(1, 0, 2, 1);
      // Ribbon tails
      pBlock(-4, 1, 2, 2); pBlock(-5, 3, 2, 2); pBlock(-6, 5, 2, 2);
      pBlock(2, 1, 2, 2); pBlock(3, 3, 2, 2); pBlock(4, 5, 2, 2);
    } else if (type === 'heart') {
      const rows = [
        [-3, -4, 2], [1, -4, 2],
        [-4, -3, 4], [0, -3, 4],
        [-5, -2, 10], [-5, -1, 10],
        [-4, 0, 8], [-3, 1, 6],
        [-2, 2, 4], [-1, 3, 2]
      ];
      rows.forEach(r => pBlock(r[0], r[1], r[2], 1));
    } else if (type === 'kitty') {
      pBlock(-4, -6, 2); pBlock(2, -6, 2);
      pBlock(-5, -5, 3); pBlock(2, -5, 3);
      pBlock(-5, -4, 10, 4);
      pBlock(-4, 0, 8, 5);
      pBlock(4, 2, 3); pBlock(6, 0, 2);
    } else if (type === 'butterfly') {
      pBlock(-1, -5, 2, 10);
      pBlock(-6, -4, 5, 3); pBlock(-7, -2, 6, 3); pBlock(-5, 1, 4, 3);
      pBlock(1, -4, 5, 3); pBlock(1, -2, 6, 3); pBlock(1, 1, 4, 3);
    }
  }

  function applyFilters(ctx, bright, contrast, mood) {
    let b = 100 + bright;
    let c = 100 + contrast;
    let extra = '';

    if (mood === 'dreamy') {
      extra = ' sepia(15%) saturate(125%) hue-rotate(-6deg)';
    } else if (mood === 'film90') {
      extra = ' sepia(20%) saturate(120%)';
    } else if (mood === 'warm') {
      extra = ' sepia(40%) hue-rotate(-15deg) saturate(130%)';
    } else if (mood === 'punk') {
      extra = ' grayscale(100%) contrast(150%)';
    } else if (mood === 'electric') {
      extra = ' hue-rotate(180deg) saturate(140%)';
    }

    ctx.filter = `brightness(${b}%) contrast(${c}%)${extra}`;
  }

  function applyDreamyGlow(ctx, img, x, y, w, h, amount) {
    if (!amount || amount <= 0 || !img) return;

    const t = Math.min(1, Math.max(0, amount / 100)); // 0..1
    ctx.save();
    // Dreamy Halation / Orton Bloom Effect:
    // Soft blurred highlights composite with screen blend for romantic, dreamy glow
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.85, 0.22 + t * 0.62);
    const blurPx = Math.round(4 + t * 16);
    ctx.filter = `blur(${blurPx}px) brightness(${Math.round(110 + t * 30)}%) saturate(${Math.round(112 + t * 22)}%)`;
    drawImageCover(ctx, img, x, y, w, h);
    ctx.restore();
  }

  function drawImageCover(ctx, img, x, y, w, h) {
    if (!img) return;
    const imgRatio = img.width / img.height;
    const canvasRatio = w / h;
    let sW, sH, sX, sY;

    if (imgRatio > canvasRatio) {
      sH = img.height;
      sW = img.height * canvasRatio;
      sX = (img.width - sW) / 2;
      sY = 0;
    } else {
      sW = img.width;
      sH = img.width / canvasRatio;
      sX = 0;
      sY = (img.height - sH) / 2;
    }
    ctx.drawImage(img, sX, sY, sW, sH, x, y, w, h);
  }

  function updateDOMOverlays() {
    const tsEl = document.getElementById('photo-timestamp-tag');
    const stampEl = document.getElementById('photo-stamp-tag');

    if (tsEl) {
      tsEl.textContent = state.timestampText;
      tsEl.style.display = state.showTimestamp ? 'block' : 'none';
    }
    if (stampEl) {
      stampEl.textContent = state.stampText;
      stampEl.style.display = state.showStamp ? 'block' : 'none';
    }

    const curFrame = FRAMES.find(f => f.id === state.activeFrame);
    const curPaper = PAPERS.find(p => p.id === state.activePaper);
    const frameLbl = document.getElementById('text-current-frame');
    const paperLbl = document.getElementById('text-current-paper');
    if (frameLbl && curFrame) frameLbl.textContent = curFrame.name;
    if (paperLbl && curPaper) paperLbl.textContent = curPaper.name;
  }

  function buildFrameList() {
    const grid = document.getElementById('pdt-frame-grid');
    if (!grid) return;
    grid.innerHTML = FRAMES.map(f => `
      <button type="button" class="pdt-item-btn ${state.activeFrame === f.id ? 'active' : ''}" data-frame="${f.id}" title="${f.name}">
        <span class="pdt-item-icon">${f.iconSvg || f.icon}</span>
        <span class="pdt-item-name">${f.name}</span>
      </button>
    `).join('');

    grid.querySelectorAll('.pdt-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeFrame = btn.dataset.frame;
        grid.querySelectorAll('.pdt-item-btn').forEach(b => b.classList.toggle('active', b === btn));
        const fObj = FRAMES.find(x => x.id === state.activeFrame);
        const nameEl = document.getElementById('text-current-frame');
        if (nameEl && fObj) nameEl.textContent = fObj.name;
        render();
      });
    });

    FRAMES.forEach(f => {
      if (!f.isProcedural && !f.isFull) loadMaskImage(f);
    });
  }

  function buildPaperList() {
    const grid = document.getElementById('pdt-paper-grid');
    if (!grid) return;
    grid.innerHTML = PAPERS.map(p => `
      <button type="button" class="pdt-item-btn ${state.activePaper === p.id ? 'active' : ''}" data-paper="${p.id}" title="${p.name}">
        <span class="pdt-item-swatch" style="background:${p.bg};"></span>
        <span class="pdt-item-name">${p.name}</span>
      </button>
    `).join('');

    grid.querySelectorAll('.pdt-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activePaper = btn.dataset.paper;
        grid.querySelectorAll('.pdt-item-btn').forEach(b => b.classList.toggle('active', b === btn));
        const pObj = PAPERS.find(x => x.id === state.activePaper);
        const nameEl = document.getElementById('text-current-paper');
        if (nameEl && pObj) nameEl.textContent = pObj.name;
        render();
      });
    });
  }


  /* ============================================================
     EMBOSS / DEBOSS ENGINE & MOTIFS
     ============================================================ */

  function loadEmbossMaterials() {
    EMBOSS_MATERIALS.forEach(mat => {
      if (mat.src) {
        const img = new Image();
        img.onload = () => {
          state.embossMaterialImages[mat.id] = img;
          if (state.editorMode === 'emboss') renderEmboss();
        };
        img.src = mat.src;
      }
    });
  }

  function buildEmbossMaterialList() {
    const grid = document.getElementById('emboss-material-grid');
    if (!grid) return;
    grid.innerHTML = '';
    EMBOSS_MATERIALS.forEach(mat => {
      const item = document.createElement('div');
      item.className = 'pdt-paper-item' + (state.emboss.material === mat.id ? ' active' : '');
      item.dataset.material = mat.id;

      const swatch = document.createElement('div');
      swatch.className = 'pdt-paper-swatch';
      swatch.style.backgroundColor = mat.bg;
      if (mat.src) {
        swatch.style.backgroundImage = 'url(' + mat.src + ')';
        swatch.style.backgroundSize = 'cover';
      }

      const label = document.createElement('div');
      label.className = 'pdt-paper-name';
      label.textContent = mat.name;

      item.appendChild(swatch);
      item.appendChild(label);

      item.addEventListener('click', () => {
        state.emboss.material = mat.id;
        state.emboss.customColor = null;
        grid.querySelectorAll('.pdt-paper-item').forEach(i => i.classList.toggle('active', i === item));
        document.querySelectorAll('.emboss-color-swatch').forEach(s => s.classList.remove('active'));
        const nameEl = document.getElementById('text-emboss-material');
        if (nameEl) nameEl.textContent = mat.name;
        renderEmboss();
      });

      grid.appendChild(item);
    });
  }

  function buildEmbossColorSwatches() {
    const container = document.getElementById('emboss-color-presets');
    if (!container) return;
    container.innerHTML = '';
    EMBOSS_COLOR_SWATCHES.forEach(s => {
      const swatch = document.createElement('div');
      swatch.className = 'emboss-color-swatch';
      swatch.style.backgroundColor = s.color;
      swatch.title = s.name;
      swatch.dataset.color = s.color;

      swatch.addEventListener('click', () => {
        state.emboss.customColor = s.color;
        container.querySelectorAll('.emboss-color-swatch').forEach(el => el.classList.toggle('active', el === swatch));
        renderEmboss();
      });

      container.appendChild(swatch);
    });
  }

  function buildEmbossMotifList() {
    const grid = document.getElementById('emboss-motif-grid');
    if (!grid) return;
    grid.innerHTML = '';
    EMBOSS_MOTIFS.forEach(m => {
      const item = document.createElement('div');
      item.className = 'pdt-frame-item' + (state.emboss.motif === m.id ? ' active' : '');
      item.dataset.motif = m.id;

      const icon = document.createElement('div');
      icon.className = 'pdt-frame-icon';
      icon.innerHTML = m.iconSvg || m.icon;

      const name = document.createElement('div');
      name.className = 'pdt-frame-name';
      name.textContent = m.name;

      item.appendChild(icon);
      item.appendChild(name);

      item.addEventListener('click', () => {
        state.emboss.motif = m.id;
        state.emboss.customGraphicImg = null;
        grid.querySelectorAll('.pdt-frame-item').forEach(i => i.classList.toggle('active', i === item));
        const txt = document.getElementById('text-emboss-motif');
        if (txt) txt.textContent = m.name;
        renderEmboss();
      });

      grid.appendChild(item);
    });
  }

  function renderEmboss() {
    if (!cvEmboss) return;

    const isSquare = state.emboss.ratio === '1:1';
    const W = 800;
    const H = isSquare ? 800 : 1000;

    cvEmboss.width = W;
    cvEmboss.height = H;
    const ctx = cvEmboss.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // 1. Draw Base Material & Texture
    const currentMat = EMBOSS_MATERIALS.find(m => m.id === state.emboss.material) || EMBOSS_MATERIALS[0];
    const baseColor = state.emboss.customColor || currentMat.bg;

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, W, H);

    if (state.embossMaterialImages[currentMat.id]) {
      const texImg = state.embossMaterialImages[currentMat.id];
      drawImageCover(ctx, texImg, 0, 0, W, H);
      if (state.emboss.customColor) {
        ctx.save();
        ctx.fillStyle = state.emboss.customColor;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }

    // Overlay fine tactile grain
    if (state.emboss.grain > 0) {
      drawProceduralNoise(ctx, W, H, state.emboss.grain);
    }

    // 2. Generate Offscreen Artwork Mask (pure solid black on transparent)
    const maskCv = document.createElement('canvas');
    maskCv.width = W;
    maskCv.height = H;
    const maskCtx = maskCv.getContext('2d');
    maskCtx.fillStyle = '#000000';
    maskCtx.strokeStyle = '#000000';

    // Draw chosen motif
    if (state.emboss.customGraphicImg) {
      drawCustomUploadedGraphic(maskCtx, W, H, state.emboss.customGraphicImg);
    } else {
      switch (state.emboss.motif) {
        case 'ribbon_flame':
          drawOrganicRibbonFlame(maskCtx, W, H);
          break;
        case 'butterfly_botanical':
          drawButterflyBotanical(maskCtx, W, H);
          break;
        case 'rose_filigree':
          drawRoseFiligree(maskCtx, W, H);
          break;
        case 'celestial_geometry':
          drawCelestialGeometry(maskCtx, W, H);
          break;
        default:
          drawOrganicRibbonFlame(maskCtx, W, H);
      }
    }

    // Draw custom embossed text
    if (state.emboss.showText && state.emboss.customText && state.emboss.customText.trim()) {
      drawEmbossedText(maskCtx, W, H, state.emboss.customText.trim(), state.emboss.ratio, state.emboss.motif);
    }

    // 3. Compute Light Vector
    let ldx = -1, ldy = -1;
    switch (state.emboss.light) {
      case 'top': ldx = 0; ldy = -1; break;
      case 'top-right': ldx = 1; ldy = -1; break;
      case 'left': ldx = -1; ldy = 0; break;
      default: ldx = -1; ldy = -1; // top-left
    }
    const len = Math.hypot(ldx, ldy) || 1;
    const nx = ldx / len;
    const ny = ldy / len;

    const depth = Math.max(1, state.emboss.depth || 4);
    const isDeboss = state.emboss.reliefType !== 'emboss';

    // 4. Render Photorealistic Relief
    renderReliefShader(ctx, maskCv, W, H, nx, ny, depth, isDeboss, state.emboss.foil);

    // Update watermark tag visibility
    const wmTag = document.getElementById('emboss-watermark-tag');
    if (wmTag) {
      wmTag.style.display = 'block';
    }
  }

  function renderReliefShader(targetCtx, maskCv, W, H, nx, ny, depth, isDeboss, foilType) {
    if (isDeboss) {
      targetCtx.save();
      targetCtx.globalAlpha = 0.18;
      targetCtx.globalCompositeOperation = 'multiply';
      targetCtx.drawImage(maskCv, 0, 0);
      targetCtx.restore();
    }

    if (foilType && foilType !== 'blind') {
      applyFoilEffect(targetCtx, maskCv, W, H, foilType);
    }

    const shiftX_hl = isDeboss ? (nx * depth) : (-nx * depth);
    const shiftY_hl = isDeboss ? (ny * depth) : (-ny * depth);

    const shiftX_sh = isDeboss ? (-nx * depth) : (nx * depth);
    const shiftY_sh = isDeboss ? (-ny * depth) : (ny * depth);

    const hlCv = document.createElement('canvas');
    hlCv.width = W;
    hlCv.height = H;
    const hlCtx = hlCv.getContext('2d');

    hlCtx.drawImage(maskCv, 0, 0);
    hlCtx.globalCompositeOperation = 'destination-out';
    hlCtx.drawImage(maskCv, shiftX_hl, shiftY_hl);

    const shCv = document.createElement('canvas');
    shCv.width = W;
    shCv.height = H;
    const shCtx = shCv.getContext('2d');

    shCtx.drawImage(maskCv, 0, 0);
    shCtx.globalCompositeOperation = 'destination-out';
    shCtx.drawImage(maskCv, shiftX_sh, shiftY_sh);

    if (isDeboss) {
      hlCtx.globalCompositeOperation = 'destination-in';
      hlCtx.drawImage(maskCv, 0, 0);

      shCtx.globalCompositeOperation = 'destination-in';
      shCtx.drawImage(maskCv, 0, 0);
    }

    targetCtx.save();
    targetCtx.globalCompositeOperation = 'multiply';
    targetCtx.globalAlpha = isDeboss ? 0.72 : 0.65;
    targetCtx.filter = 'blur(' + Math.max(1, depth * 0.4) + 'px)';
    targetCtx.drawImage(shCv, 0, 0);
    targetCtx.restore();

    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    targetCtx.globalAlpha = 0.78;
    targetCtx.filter = 'blur(' + Math.max(1, depth * 0.35) + 'px)';
    targetCtx.drawImage(hlCv, 0, 0);
    targetCtx.restore();

    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    targetCtx.globalAlpha = 0.35;
    targetCtx.drawImage(hlCv, 0, 0);
    targetCtx.restore();
  }

  function applyFoilEffect(ctx, maskCv, W, H, foilType) {
    const foilCv = document.createElement('canvas');
    foilCv.width = W;
    foilCv.height = H;
    const fCtx = foilCv.getContext('2d');

    fCtx.drawImage(maskCv, 0, 0);
    fCtx.globalCompositeOperation = 'source-in';

    if (foilType === 'gold') {
      const grad = fCtx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#a67c1e');
      grad.addColorStop(0.25, '#ffd97d');
      grad.addColorStop(0.5, '#c99a2c');
      grad.addColorStop(0.75, '#fff0b8');
      grad.addColorStop(1, '#8b6414');
      fCtx.fillStyle = grad;
      fCtx.fillRect(0, 0, W, H);
    } else if (foilType === 'silver') {
      const grad = fCtx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#9e9e9e');
      grad.addColorStop(0.3, '#f5f5f5');
      grad.addColorStop(0.6, '#b0b0b0');
      grad.addColorStop(0.85, '#ffffff');
      grad.addColorStop(1, '#888888');
      fCtx.fillStyle = grad;
      fCtx.fillRect(0, 0, W, H);
    } else if (foilType === 'white') {
      fCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      fCtx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.globalAlpha = foilType === 'white' ? 0.85 : 0.8;
    ctx.drawImage(foilCv, 0, 0);
    ctx.restore();
  }

  function drawProceduralNoise(ctx, W, H, grainVal) {
    const pCv = document.createElement('canvas');
    const pSize = 128;
    pCv.width = pSize;
    pCv.height = pSize;
    const pCtx = pCv.getContext('2d');
    const imgData = pCtx.createImageData(pSize, pSize);
    const data = imgData.data;
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = (Math.random() * 45) | 0;
    }
    pCtx.putImageData(imgData, 0, 0);

    ctx.save();
    ctx.globalAlpha = (grainVal / 100) * 0.28;
    ctx.globalCompositeOperation = 'overlay';
    const pattern = ctx.createPattern(pCv, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  function drawOrganicRibbonFlame(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';

    ctx.beginPath();
    ctx.moveTo(W * 0.08, H * 0.95);
    ctx.bezierCurveTo(W * 0.02, H * 0.72, W * 0.32, H * 0.58, W * 0.20, H * 0.38);
    ctx.bezierCurveTo(W * 0.12, H * 0.24, W * 0.22, H * 0.12, W * 0.18, H * 0.04);
    ctx.bezierCurveTo(W * 0.26, H * 0.09, W * 0.28, H * 0.22, W * 0.25, H * 0.32);
    ctx.bezierCurveTo(W * 0.38, H * 0.48, W * 0.14, H * 0.68, W * 0.18, H * 0.95);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W * 0.18, H * 0.88);
    ctx.bezierCurveTo(W * 0.28, H * 0.70, W * 0.45, H * 0.55, W * 0.34, H * 0.40);
    ctx.bezierCurveTo(W * 0.28, H * 0.30, W * 0.40, H * 0.25, W * 0.42, H * 0.16);
    ctx.bezierCurveTo(W * 0.46, H * 0.22, W * 0.42, H * 0.34, W * 0.38, H * 0.42);
    ctx.bezierCurveTo(W * 0.48, H * 0.60, W * 0.32, H * 0.76, W * 0.22, H * 0.88);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W * 0.24, H * 0.65);
    ctx.bezierCurveTo(W * 0.38, H * 0.52, W * 0.56, H * 0.48, W * 0.48, H * 0.32);
    ctx.bezierCurveTo(W * 0.44, H * 0.26, W * 0.54, H * 0.22, W * 0.56, H * 0.12);
    ctx.bezierCurveTo(W * 0.60, H * 0.20, W * 0.56, H * 0.32, W * 0.52, H * 0.38);
    ctx.bezierCurveTo(W * 0.62, H * 0.52, W * 0.42, H * 0.62, W * 0.28, H * 0.68);
    ctx.closePath();
    ctx.fill();

    drawTeardropFlame(ctx, W * 0.32, H * 0.22, 28, -0.3);
    drawTeardropFlame(ctx, W * 0.24, H * 0.15, 20, -0.4);
    drawTeardropFlame(ctx, W * 0.48, H * 0.24, 22, 0.2);
    drawTeardropFlame(ctx, W * 0.58, H * 0.36, 26, 0.5);
    drawTeardropFlame(ctx, W * 0.44, H * 0.68, 30, 0.4);
    drawTeardropFlame(ctx, W * 0.36, H * 0.78, 24, 0.3);
    drawTeardropFlame(ctx, W * 0.22, H * 0.08, 16, -0.2);

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(W * 0.16, H * 0.46, 60, -0.6 * Math.PI, 0.4 * Math.PI);
    ctx.stroke();

    ctx.restore();
  }

  function drawTeardropFlame(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.6, -size * 0.4, size * 0.8, size * 0.4, 0, size);
    ctx.bezierCurveTo(-size * 0.8, size * 0.4, -size * 0.6, -size * 0.4, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawButterflyBotanical(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';

    const cx = W / 2;
    const cy = H * 0.38;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, -42, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-3, -48);
    ctx.bezierCurveTo(-15, -70, -32, -65, -34, -54);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(3, -48);
    ctx.bezierCurveTo(15, -70, 32, -65, 34, -54);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-34, -54, 4, 0, Math.PI * 2);
    ctx.arc(34, -54, 4, 0, Math.PI * 2);
    ctx.fill();

    drawForewing(ctx, 1);
    drawForewing(ctx, -1);

    drawHindwing(ctx, 1);
    drawHindwing(ctx, -1);

    ctx.restore();

    drawFourPointStar(ctx, W * 0.18, H * 0.22, 26, 6);
    drawFourPointStar(ctx, W * 0.82, H * 0.22, 26, 6);
    drawFourPointStar(ctx, W * 0.14, H * 0.52, 20, 5);
    drawFourPointStar(ctx, W * 0.86, H * 0.52, 20, 5);
    drawFourPointStar(ctx, W * 0.5, H * 0.12, 32, 8);
    drawFourPointStar(ctx, W * 0.32, H * 0.15, 14, 3.5);
    drawFourPointStar(ctx, W * 0.68, H * 0.15, 14, 3.5);

    drawBotanicalBranch(ctx, W * 0.14, H * 0.38, 1);
    drawBotanicalBranch(ctx, W * 0.86, H * 0.38, -1);

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(W * 0.28 + i * (W * 0.11), H * 0.58, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawForewing(ctx, side) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.bezierCurveTo(45, -75, 130, -95, 155, -45);
    ctx.bezierCurveTo(165, -15, 140, 20, 75, 10);
    ctx.bezierCurveTo(40, 6, 12, 10, 8, 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(80, -35, 38, 16, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(115, -12, 20, 9, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHindwing(ctx, side) {
    ctx.save();
    ctx.scale(side, 1);
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.bezierCurveTo(45, 15, 95, 25, 90, 70);
    ctx.bezierCurveTo(85, 105, 45, 100, 28, 75);
    ctx.bezierCurveTo(22, 65, 14, 50, 8, 28);
    ctx.closePath();
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.ellipse(54, 55, 20, 11, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFourPointStar(ctx, cx, cy, rOuter, rInner) {
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 - Math.PI / 2;
      const r = (i % 2 === 0) ? rOuter : rInner;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBotanicalBranch(ctx, startX, startY, dir) {
    ctx.save();
    ctx.translate(startX, startY);
    ctx.scale(dir, 1);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, 80);
    ctx.bezierCurveTo(20, 20, -10, -40, 15, -80);
    ctx.stroke();

    const leafOffsets = [-60, -35, -10, 15, 40, 65];
    leafOffsets.forEach((yOff, idx) => {
      ctx.save();
      ctx.translate((idx % 2 === 0 ? 12 : -10), yOff);
      ctx.rotate(idx % 2 === 0 ? 0.6 : -0.6);
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawRoseFiligree(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    const cx = W / 2;
    const cy = H * 0.38;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-8, -10, 45, 0.1 * Math.PI, 1.2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(10, 12, 42, 0.8 * Math.PI, 1.9 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-5, 5, 25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(4, -4, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cx, cy + 70);
    ctx.bezierCurveTo(cx - 30, cy + 140, cx + 40, cy + 200, cx, cy + 260);
    ctx.stroke();

    drawRoseLeaf(ctx, cx - 20, cy + 130, -0.6);
    drawRoseLeaf(ctx, cx + 24, cy + 185, 0.7);

    ctx.restore();
  }

  function drawRoseLeaf(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.ellipse(0, 0, 36, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCelestialGeometry(ctx, W, H) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';

    const cx = W / 2;
    const cy = H * 0.38;

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 140, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 148, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 95, 0, Math.PI * 2);
    ctx.stroke();

    const numRays = 32;
    for (let i = 0; i < numRays; i++) {
      const angle = (i * Math.PI * 2) / numRays;
      const isLong = (i % 2 === 0);
      const r1 = 100;
      const r2 = isLong ? 134 : 118;
      ctx.lineWidth = isLong ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + 6, cy - 6, 38, 0, Math.PI * 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    drawFourPointStar(ctx, cx - 180, cy - 80, 22, 5);
    drawFourPointStar(ctx, cx + 180, cy - 80, 22, 5);
    drawFourPointStar(ctx, cx - 150, cy + 100, 18, 4);
    drawFourPointStar(ctx, cx + 150, cy + 100, 18, 4);

    ctx.restore();
  }

  function drawEmbossedText(ctx, W, H, text, ratio, motif) {
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isSquare = ratio === '1:1';
    let posY = isSquare ? H * 0.82 : H * 0.74;

    if (motif === 'ribbon_flame') {
      posY = isSquare ? H * 0.84 : H * 0.82;
    }

    const fontSize = text.length > 16 ? 26 : (text.length > 12 ? 32 : 38);
    ctx.font = '700 ' + fontSize + 'px Arial, sans-serif';

    const chars = text.toUpperCase().split('');
    const trackedText = chars.join(' ');
    ctx.fillText(trackedText, W / 2, posY);

    ctx.lineWidth = 2.5;
    const ruleWidth = Math.min(W * 0.65, trackedText.length * (fontSize * 0.45));
    ctx.beginPath();
    ctx.moveTo(W / 2 - ruleWidth / 2, posY + fontSize * 0.75);
    ctx.lineTo(W / 2 + ruleWidth / 2, posY + fontSize * 0.75);
    ctx.stroke();

    ctx.restore();
  }

  function drawCustomUploadedGraphic(ctx, W, H, img) {
    ctx.save();
    const maxDim = Math.min(W * 0.6, H * 0.5);
    const scale = Math.min(maxDim / img.width, maxDim / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = (W - dw) / 2;
    const dy = (H * 0.4) - dh / 2;

    const tempCv = document.createElement('canvas');
    tempCv.width = dw;
    tempCv.height = dh;
    const tCtx = tempCv.getContext('2d');
    tCtx.drawImage(img, 0, 0, dw, dh);
    tCtx.globalCompositeOperation = 'source-in';
    tCtx.fillStyle = '#000000';
    tCtx.fillRect(0, 0, dw, dh);

    ctx.drawImage(tempCv, dx, dy);
    ctx.restore();
  }

  function bindEvents() {
    // 1. File Upload (Button & Direct Click on Card Photo)
    const fileInput = document.getElementById('photo-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          loadPhotoFromFile(e.target.files[0]);
        }
      });
    }

    // Clicking top card section triggers file upload!
    const topHalf = document.getElementById('photo-card-photo');
    if (topHalf && fileInput) {
      topHalf.addEventListener('click', () => fileInput.click());
    }

    // Drag and drop image anywhere onto card stage
    if (stageEl) {
      stageEl.addEventListener('dragover', e => { e.preventDefault(); });
      stageEl.addEventListener('drop', e => {
        e.preventDefault();
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          loadPhotoFromFile(e.dataTransfer.files[0]);
        }
      });
    }

    // 2. 3D Card Interactive Tilt
    if (stageEl && cardEl) {
      stageEl.addEventListener('mousemove', e => {
        const rect = stageEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        cardEl.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
      });
      stageEl.addEventListener('mouseleave', () => {
        cardEl.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      });
    }

    // 3. Tab switching (Style & Adjust in Photo Stencil)
    const photoDrawer = document.querySelector('#workspace-cutout .photo-editor-drawer');
    if (photoDrawer) {
      const tabs = photoDrawer.querySelectorAll('.photo-drawer-tabs .pdt-tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.dataset.tab;
          if (!target) return;
          tabs.forEach(t => t.classList.toggle('active', t === tab));
          photoDrawer.querySelectorAll('.photo-tab-panel').forEach(p => {
            p.classList.toggle('active', p.id === 'tab-panel-' + target);
          });
        });
      });
    }

    // 3b. Paper Color Swatches & Native Custom Color Picker
    const paperSwatches = document.querySelectorAll('#pdt-paper-swatches .pdt-color-swatch');
    const customColorInp = document.getElementById('pdt-input-custom-color');
    const curPaperColorLbl = document.getElementById('text-current-paper-color');

    paperSwatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        paperSwatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        const color = swatch.dataset.color;
        if (color === 'default') {
          state.customColor = null;
          if (curPaperColorLbl) curPaperColorLbl.textContent = 'Default';
          if (customColorInp) customColorInp.value = '#f6f6f9';
        } else {
          state.customColor = color;
          if (customColorInp) customColorInp.value = color;
          if (curPaperColorLbl) curPaperColorLbl.textContent = swatch.title || color.toUpperCase();
        }
        render();
      });
    });

    if (customColorInp) {
      customColorInp.addEventListener('input', e => {
        state.customColor = e.target.value;
        paperSwatches.forEach(s => s.classList.remove('active'));
        if (curPaperColorLbl) curPaperColorLbl.textContent = e.target.value.toUpperCase();
        render();
      });
    }

    // 3.5. Format / Aspect Ratio Switcher (Stage)
    function setPhotoRatio(ratio) {
      if (!CARD_RATIOS[ratio]) ratio = '4:5';
      state.ratio = ratio;
      document.querySelectorAll('#workspace-cutout .prs-btn').forEach(b => b.classList.toggle('active', b.dataset.ratio === ratio));
      render();
    }

    document.querySelectorAll('#workspace-cutout .prs-btn').forEach(btn => {
      btn.addEventListener('click', () => setPhotoRatio(btn.dataset.ratio));
    });

    // 4. View mode switcher
    const viewBtns = document.querySelectorAll('.pvs-btn');
    const splitDirContainer = document.getElementById('photo-split-section') || document.getElementById('photo-split-dir-switcher');
    const splitDirBtns = document.querySelectorAll('.psd-btn');

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.viewMode = btn.dataset.view;
        viewBtns.forEach(b => b.classList.toggle('active', b === btn));

        const photoHalf = document.getElementById('photo-card-photo');
        const artHalf = document.getElementById('photo-card-art');
        const fold = document.querySelector('.photo-card-fold-line');

        if (state.viewMode === 'art') {
          if (photoHalf) photoHalf.style.display = 'none';
          if (artHalf) artHalf.style.display = 'block';
          if (fold) fold.style.display = 'none';
          if (splitDirContainer) splitDirContainer.style.display = 'none';
        } else if (state.viewMode === 'photo') {
          if (photoHalf) photoHalf.style.display = 'block';
          if (artHalf) artHalf.style.display = 'none';
          if (fold) fold.style.display = 'none';
          if (splitDirContainer) splitDirContainer.style.display = 'none';
        } else {
          if (photoHalf) photoHalf.style.display = '';
          if (artHalf) artHalf.style.display = '';
          if (fold) fold.style.display = '';
          if (splitDirContainer) splitDirContainer.style.display = 'inline-flex';
        }
        render();
      });
    });

    // 4.1 Split Direction switcher (atas-bawah vs kanan-kiri)
    splitDirBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.splitDir = btn.dataset.dir;
        splitDirBtns.forEach(b => b.classList.toggle('active', b === btn));
        render();
      });
    });

    // 5. Adjust Sliders & Moods
    // Effect Mode Switcher (Pixel Art vs Cross Stitch)
    const effectChips = document.querySelectorAll('#pdt-effect-chips .pdt-chip');
    const rowPixel = document.getElementById('pdt-row-pixel');
    const rowStitch = document.getElementById('pdt-row-stitch');
    const rowAida = document.getElementById('pdt-row-aida');
    const rowStitchTop = document.getElementById('pdt-row-stitch-top');
    const btnViewArt = document.getElementById('btn-view-art');

    effectChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.effectType = chip.dataset.effect;
        effectChips.forEach(c => c.classList.toggle('active', c === chip));

        const isCross = state.effectType === 'cross-stitch';
        if (rowPixel) rowPixel.style.display = isCross ? 'none' : 'flex';
        if (rowStitch) rowStitch.style.display = isCross ? 'flex' : 'none';
        if (rowAida) rowAida.style.display = isCross ? 'flex' : 'none';
        if (rowStitchTop) rowStitchTop.style.display = isCross ? 'flex' : 'none';

        if (btnViewArt) {
          btnViewArt.textContent = isCross ? 'cross stitch only' : 'pixel art only';
        }

        render();
      });
    });

    const slStitch = document.getElementById('pdt-range-stitch');
    const chkAida = document.getElementById('pdt-toggle-aida');
    const chkStitchTop = document.getElementById('pdt-toggle-stitch-top');

    if (slStitch) {
      slStitch.addEventListener('input', e => {
        state.stitchSize = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-range-stitch');
        if (valEl) valEl.textContent = state.stitchSize + 'px';
        render();
      });
    }
    if (chkAida) {
      chkAida.addEventListener('change', e => {
        state.showAidaCloth = e.target.checked;
        render();
      });
    }
    if (chkStitchTop) {
      chkStitchTop.addEventListener('change', e => {
        state.stitchApplyTop = e.target.checked;
        render();
      });
    }

    const slPixel = document.getElementById('pdt-range-pixel');
    const slDreamy = document.getElementById('pdt-range-dreamy');
    const slBright = document.getElementById('pdt-range-bright');
    const slContrast = document.getElementById('pdt-range-contrast');
    const chkInvert = document.getElementById('pdt-toggle-invert');

    if (slPixel) {
      slPixel.addEventListener('input', e => {
        state.pixelSize = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-range-pixel');
        if (valEl) {
          valEl.textContent = state.pixelSize === 0 ? 'Off (foto asli)' : state.pixelSize + 'px';
        }
        render();
      });
    }
    if (slDreamy) {
      slDreamy.addEventListener('input', e => {
        state.dreamy = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-range-dreamy');
        if (valEl) {
          valEl.textContent = state.dreamy === 0 ? 'Off' : `+${state.dreamy}%`;
        }
        render();
      });
    }
    if (slBright) {
      slBright.addEventListener('input', e => {
        state.brightness = parseInt(e.target.value, 10);
        document.getElementById('val-range-bright').textContent = state.brightness;
        render();
      });
    }
    if (slContrast) {
      slContrast.addEventListener('input', e => {
        state.contrast = parseInt(e.target.value, 10);
        document.getElementById('val-range-contrast').textContent = (state.contrast > 0 ? '+' : '') + state.contrast;
        render();
      });
    }
    if (chkInvert) {
      chkInvert.addEventListener('change', e => {
        state.invert = e.target.checked;
        render();
      });
    }

    const moodChips = document.querySelectorAll('#pdt-mood-chips .pdt-chip');
    moodChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.mood = chip.dataset.mood;
        moodChips.forEach(c => c.classList.toggle('active', c === chip));
        if (state.mood === 'dreamy' && state.dreamy === 0) {
          state.dreamy = 45;
          const slD = document.getElementById('pdt-range-dreamy');
          const valD = document.getElementById('val-range-dreamy');
          if (slD) slD.value = 45;
          if (valD) valD.textContent = '+45%';
        }
        render();
      });
    });

    // 6. Note / Timestamp inputs
    const chkTs = document.getElementById('pdt-toggle-timestamp');
    const inTs = document.getElementById('pdt-input-timestamp');
    const chkStamp = document.getElementById('pdt-toggle-stamp');
    const inStamp = document.getElementById('pdt-input-stamp');

    if (chkTs) chkTs.addEventListener('change', e => { state.showTimestamp = e.target.checked; updateDOMOverlays(); });
    if (inTs) inTs.addEventListener('input', e => { state.timestampText = e.target.value; updateDOMOverlays(); });
    if (chkStamp) chkStamp.addEventListener('change', e => { state.showStamp = e.target.checked; updateDOMOverlays(); });
    if (inStamp) inStamp.addEventListener('input', e => { state.stampText = e.target.value; updateDOMOverlays(); });

    // Sample Photo Buttons
    const sampleBtns = document.querySelectorAll('.pdt-sample-btn');
    sampleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const sKey = btn.dataset.sample;
        if (SAMPLES[sKey]) loadSamplePhoto(SAMPLES[sKey]);
      });
    });

    // 7. Save Image & Add to Zine
    const btnExport = document.getElementById('btn-photo-export');
    if (btnExport) {
      btnExport.addEventListener('click', () => {
        const btnStitch = document.getElementById('btn-mode-stitch');
        if (btnStitch && btnStitch.classList.contains('active') && window.ZineCrossStitch?.exportPNG) {
          return window.ZineCrossStitch.exportPNG();
        }
        exportFullCardImage();
      });
    }

    const btnAddZine = document.getElementById('btn-photo-add-zine');
    if (btnAddZine) {
      btnAddZine.addEventListener('click', () => {
        const btnStitch = document.getElementById('btn-mode-stitch');
        if (btnStitch && btnStitch.classList.contains('active') && window.ZineCrossStitch?.addToZine) {
          return window.ZineCrossStitch.addToZine();
        }
        addPhotoToZineCanvas();
      });
    }

    // 8. Editor Mode Switcher (Pixel Cutout vs Emboss Art)
    const btnModePixel = document.getElementById('pms-mode-pixel');
    const btnModeEmboss = document.getElementById('pms-mode-emboss');
    const wsPixel = document.getElementById('workspace-pixel');
    const wsEmboss = document.getElementById('workspace-emboss');

    if (btnModePixel && btnModeEmboss) {
      btnModePixel.addEventListener('click', () => {
        state.editorMode = 'pixel';
        btnModePixel.classList.add('active');
        btnModeEmboss.classList.remove('active');
        if (wsPixel) wsPixel.classList.remove('hidden');
        if (wsEmboss) wsEmboss.classList.add('hidden');
        render();
      });

      btnModeEmboss.addEventListener('click', () => {
        state.editorMode = 'emboss';
        btnModeEmboss.classList.add('active');
        btnModePixel.classList.remove('active');
        if (wsEmboss) wsEmboss.classList.remove('hidden');
        if (wsPixel) wsPixel.classList.add('hidden');
        renderEmboss();
      });
    }

    // 9. Emboss 3D Tilt Stage
    if (embossStageEl && embossCardEl) {
      embossStageEl.addEventListener('mousemove', e => {
        const rect = embossStageEl.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        embossCardEl.style.transform = 'perspective(1000px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 14) + 'deg)';
      });
      embossStageEl.addEventListener('mouseleave', () => {
        embossCardEl.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
      });
    }

    // 10. Aspect Ratio Switcher (Instagram 4:5 vs 1:1)
    const ratioBtns = document.querySelectorAll('#emboss-ratio-switcher .pvs-btn');
    ratioBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.emboss.ratio = btn.dataset.ratio;
        ratioBtns.forEach(b => b.classList.toggle('active', b === btn));
        if (embossCardEl) {
          embossCardEl.classList.toggle('ratio-square', state.emboss.ratio === '1:1');
        }
        renderEmboss();
      });
    });

    // 11. Emboss Drawer Tabs (Material, Artwork, Emboss)
    const embossTabs = document.querySelectorAll('#emboss-drawer .photo-drawer-tabs .pdt-tab');
    embossTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.embossTab;
        embossTabs.forEach(t => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.emboss-tab-panel').forEach(p => {
          p.classList.toggle('active', p.id === 'tab-emboss-' + target);
        });
      });
    });

    // 12. Grain Slider
    const slGrain = document.getElementById('emboss-range-grain');
    if (slGrain) {
      slGrain.addEventListener('input', e => {
        state.emboss.grain = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-emboss-grain');
        if (valEl) valEl.textContent = state.emboss.grain + '%';
        renderEmboss();
      });
    }

    // 13. Text Input & Show/Hide Button
    const inText = document.getElementById('emboss-input-text');
    const btnToggleText = document.getElementById('btn-toggle-emboss-text');
    if (inText) {
      inText.addEventListener('input', e => {
        state.emboss.customText = e.target.value;
        renderEmboss();
      });
    }
    if (btnToggleText) {
      btnToggleText.classList.toggle('active', state.emboss.showText);
      btnToggleText.textContent = state.emboss.showText ? 'Hide Text' : 'Show Text';
      btnToggleText.addEventListener('click', () => {
        state.emboss.showText = !state.emboss.showText;
        btnToggleText.classList.toggle('active', state.emboss.showText);
        btnToggleText.textContent = state.emboss.showText ? 'Hide Text' : 'Show Text';
        renderEmboss();
      });
    }

    // 14. Custom Graphic Upload
    const btnUploadGraphic = document.getElementById('btn-upload-emboss-graphic');
    const inputGraphic = document.getElementById('emboss-graphic-input');
    if (btnUploadGraphic && inputGraphic) {
      btnUploadGraphic.addEventListener('click', () => inputGraphic.click());
      inputGraphic.addEventListener('change', e => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = ev => {
            const img = new Image();
            img.onload = () => {
              state.emboss.customGraphicImg = img;
              const txt = document.getElementById('text-emboss-motif');
              if (txt) txt.textContent = 'Custom Graphic';
              document.querySelectorAll('#emboss-motif-grid .pdt-frame-item').forEach(i => i.classList.remove('active'));
              renderEmboss();
              if (window.toast) window.toast('grafis emboss kustom diunggah!');
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 15. Relief Type Chips (Deboss vs Emboss)
    const typeChips = document.querySelectorAll('#emboss-type-chips .pdt-chip');
    typeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.emboss.reliefType = chip.dataset.embossType;
        typeChips.forEach(c => c.classList.toggle('active', c === chip));
        renderEmboss();
      });
    });

    // 16. Depth Intensity Slider
    const slDepth = document.getElementById('emboss-range-depth');
    if (slDepth) {
      slDepth.addEventListener('input', e => {
        state.emboss.depth = parseInt(e.target.value, 10);
        const valEl = document.getElementById('val-emboss-depth');
        if (valEl) valEl.textContent = state.emboss.depth + 'px';
        renderEmboss();
      });
    }

    // 17. Light Direction Chips
    const lightChips = document.querySelectorAll('#emboss-light-chips .pdt-chip');
    lightChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.emboss.light = chip.dataset.light;
        lightChips.forEach(c => c.classList.toggle('active', c === chip));
        renderEmboss();
      });
    });

    // 18. Foil / Inking Chips
    const foilChips = document.querySelectorAll('#emboss-foil-chips .pdt-chip');
    foilChips.forEach(chip => {
      chip.addEventListener('click', () => {
        state.emboss.foil = chip.dataset.foil;
        foilChips.forEach(c => c.classList.toggle('active', c === chip));
        renderEmboss();
      });
    });
  }

  /* ============================================================
     EXPORT & CANVAS INTEGRATION
     ============================================================ */
  function generateHighResCardCanvas() {
    const isSplit = state.viewMode === 'split';
    const isPhotoOnly = state.viewMode === 'photo';
    const isHorizontal = isSplit && state.splitDir === 'horizontal';

    const outCv = document.createElement('canvas');
    const ctx = outCv.getContext('2d');

    if (isPhotoOnly) {
      outCv.width = cvPhoto.width;
      outCv.height = cvPhoto.height;
      ctx.drawImage(cvPhoto, 0, 0);
    } else if (!isSplit) {
      // Cutout art only
      outCv.width = cvArt.width;
      outCv.height = cvArt.height;
      ctx.drawImage(cvArt, 0, 0);
      drawExportOverlays(ctx, cvArt.width, cvArt.height, 0, 0);
    } else if (isHorizontal) {
      // Split horizontal: LEFT photo with stencil, RIGHT lace/paper cutout
      outCv.width = cvPhoto.width * 2;
      outCv.height = cvPhoto.height;

      // Left: Photo with stencil
      ctx.drawImage(cvPhoto, 0, 0);

      // Fold line (vertical)
      ctx.fillStyle = '#000000';
      ctx.fillRect(cvPhoto.width - 1, 0, 2, outCv.height);

      // Right: Lace/paper cutout
      ctx.drawImage(cvArt, cvPhoto.width, 0);
      drawExportOverlays(ctx, cvArt.width, cvArt.height, 0, cvPhoto.width);
    } else {
      // Split vertical: TOP photo with stencil, BOTTOM lace/paper cutout
      outCv.width = cvPhoto.width;
      outCv.height = cvPhoto.height * 2;

      // Top: Photo with stencil
      ctx.drawImage(cvPhoto, 0, 0);

      // Fold line (horizontal)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, cvPhoto.height - 1, outCv.width, 2);

      // Bottom: Lace/paper cutout
      ctx.drawImage(cvArt, 0, cvPhoto.height);
      drawExportOverlays(ctx, cvArt.width, cvArt.height, cvPhoto.height, 0);
    }

    return outCv;
  }

  function drawExportOverlays(ctx, W, H, offsetY = 0, offsetX = 0) {
    if (state.showTimestamp && state.timestampText) {
      ctx.save();
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#ffe600';
      ctx.shadowColor = 'rgba(255, 230, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.fillText(state.timestampText, offsetX + 24, offsetY + H - 24);
      ctx.restore();
    }
    if (state.showStamp && state.stampText) {
      ctx.save();
      ctx.font = '600 15px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.textAlign = 'right';
      ctx.fillText(state.stampText, offsetX + W - 24, offsetY + H * 0.45);
      ctx.restore();
    }
  }

  function exportFullCardImage() {
    if (state.editorMode === 'emboss') {
      const cv = cvEmboss;
      if (!cv) return;
      const link = document.createElement('a');
      link.download = 'blind-emboss-' + state.emboss.material + '-' + Date.now() + '.png';
      link.href = cv.toDataURL('image/png');
      link.click();
      if (window.toast) window.toast('emboss art berhasil disimpan ke unduhan!');
      return;
    }

    const cv = generateHighResCardCanvas();
    const link = document.createElement('a');
    const prefix = state.effectType === 'cross-stitch' ? 'cross-stitch-' : 'pixel-art-photo-';
    link.download = prefix + Date.now() + '.png';
    link.href = cv.toDataURL('image/png');
    link.click();
    const toastMsg = state.effectType === 'cross-stitch' ? 'karya cross-stitch berhasil diunduh!' : 'foto berhasil disimpan ke unduhan!';
    if (window.toast) window.toast(toastMsg);
  }

  function addPhotoToZineCanvas() {
    if (state.editorMode === 'emboss') {
      const cv = cvEmboss;
      if (!cv) return;
      const dataUrl = cv.toDataURL('image/png');
      insertImageToActiveCanvas(dataUrl, 'emboss art ditambahkan ke kanvas zine!');
      return;
    }

    const cv = generateHighResCardCanvas();
    const dataUrl = cv.toDataURL('image/png');
    const toastMsg = state.effectType === 'cross-stitch' ? 'karya cross-stitch ditambahkan ke kanvas zine!' : 'foto pixel art ditambahkan ke kanvas zine!';
    insertImageToActiveCanvas(dataUrl, toastMsg);
  }

  function insertImageToActiveCanvas(dataUrl, toastMsg) {
    if (!window.fabric) return;
    fabric.Image.fromURL(dataUrl, img => {
      const canvas = (window.ZineApp && window.ZineApp.activeCanvas) ? window.ZineApp.activeCanvas() : null;
      if (!canvas) {
        if (window.showScreen) window.showScreen('editor');
        return;
      }

      const maxDim = 380;
      const scale = Math.min(maxDim / img.width, maxDim / img.height);
      img.set({
        scaleX: scale,
        scaleY: scale,
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
        cornerStyle: 'circle',
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#000000',
        borderScaleFactor: 1.5
      });

      canvas.add(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();

      if (window.showScreen) window.showScreen('editor');
      if (window.toast) window.toast(toastMsg || 'gambar ditambahkan ke kanvas zine!');
    });
  }

  window.ZinePhotoEditor = {
    init: init,
    render: render,
    renderEmboss: renderEmboss,
    loadPhotoFromFile: loadPhotoFromFile,
    getCurrentImage: () => state.currentImage,
    getExportDataURL: () => (state.editorMode === 'emboss' && cvEmboss) ? cvEmboss.toDataURL('image/png') : generateHighResCardCanvas().toDataURL('image/png')
  };
})();
