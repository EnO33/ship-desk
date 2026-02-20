;(function () {
  'use strict'

  var script = document.currentScript
  if (!script) return

  var slug = script.getAttribute('data-slug')
  if (!slug) {
    console.warn('[ShipDesk] Missing data-slug attribute on widget script tag.')
    return
  }

  var position = script.getAttribute('data-position') || 'bottom-right'
  var theme = script.getAttribute('data-theme') || 'system'
  var origin = (script.getAttribute('src') || '').replace(/\/widget\.js.*$/, '')

  var isOpen = false
  var button = null
  var panel = null
  var backdrop = null
  var Z = '2147483647'

  var bellSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>'

  var closeSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'

  var pos = position === 'bottom-left' ? 'left:20px;' : 'right:20px;'

  function createButton() {
    button = document.createElement('button')
    button.setAttribute('aria-label', "What's New")
    button.setAttribute('type', 'button')
    button.innerHTML = bellSvg
    button.style.cssText =
      'position:fixed;bottom:20px;' +
      pos +
      'z-index:' +
      Z +
      ';width:52px;height:52px;border-radius:50%;border:none;cursor:pointer;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:#6366f1;color:#fff;' +
      'box-shadow:0 4px 14px rgba(99,102,241,0.4);' +
      'transition:transform 0.2s ease,box-shadow 0.2s ease;'

    button.addEventListener('mouseenter', function () {
      button.style.transform = 'scale(1.08)'
      button.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'
    })
    button.addEventListener('mouseleave', function () {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)'
    })
    button.addEventListener('click', toggle)
    document.body.appendChild(button)
  }

  function createPanel() {
    backdrop = document.createElement('div')
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:' + Z + ';background:transparent;'
    backdrop.addEventListener('click', close)

    panel = document.createElement('div')
    panel.style.cssText =
      'position:fixed;bottom:80px;' +
      pos +
      'z-index:' +
      Z +
      ';width:380px;height:520px;max-height:calc(100vh - 100px);' +
      'border-radius:12px;overflow:hidden;' +
      'box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);' +
      'transform:translateY(10px);opacity:0;' +
      'transition:transform 0.25s ease,opacity 0.25s ease;'

    var iframe = document.createElement('iframe')
    iframe.src =
      origin +
      '/widget/' +
      encodeURIComponent(slug) +
      '?theme=' +
      encodeURIComponent(theme)
    iframe.style.cssText = 'width:100%;height:100%;border:none;'
    iframe.setAttribute('title', "What's New")
    iframe.setAttribute('loading', 'lazy')
    iframe.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox',
    )

    panel.appendChild(iframe)
  }

  function toggle() {
    if (isOpen) close()
    else open()
  }

  function open() {
    if (isOpen) return
    isOpen = true
    if (!panel) createPanel()
    document.body.appendChild(backdrop)
    document.body.appendChild(panel)
    requestAnimationFrame(function () {
      panel.style.transform = 'translateY(0)'
      panel.style.opacity = '1'
    })
    button.innerHTML = closeSvg
    document.addEventListener('keydown', onEscape)
  }

  function close() {
    if (!isOpen) return
    isOpen = false
    panel.style.transform = 'translateY(10px)'
    panel.style.opacity = '0'
    setTimeout(function () {
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
      if (panel.parentNode) panel.parentNode.removeChild(panel)
    }, 250)
    button.innerHTML = bellSvg
    document.removeEventListener('keydown', onEscape)
  }

  function onEscape(e) {
    if (e.key === 'Escape') close()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton)
  } else {
    createButton()
  }
})()
