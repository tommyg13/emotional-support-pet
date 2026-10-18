/* Search companions are separate from the summon/gallery Characters registry.
 * Only predefined entries can be mounted. Renderers own animation and cleanup;
 * this controller owns the common action contract. No asset URLs from settings.
 */
(function (root) {
  'use strict';
  class CharacterController {
    constructor(definition, mode, renderer, actions, icons) {
      this.definition = definition;
      this.mode = mode;
      this.renderer = renderer;
      this.actions = Object.freeze(actions);
      this.icons = Object.freeze(icons);
      this.destroyed = false;
    }
    supports(action) { return !this.destroyed && typeof this.actions[action] === 'function'; }
    perform(action, ...args) {
      if (!this.supports(action)) return false;
      return this.actions[action](...args);
    }
    get ready() { return this.renderer.ready || Promise.resolve(true); }
    get element() { return this.renderer.element; }
    getBounds() { return this.perform('getBounds'); }
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.renderer.destroy();
    }
  }
  const actionNames = ['walkTo', 'runTo', 'sit', 'sleep', 'wake', 'lookAt', 'stop',
    'jump', 'setSpeed', 'setPosition', 'getPosition', 'getPose', 'isHeld', 'drop',
    'setName', 'setPersonality', 'blink', 'react', 'searchCompleted', 'queryReset', 'giveCare', 'play',
    'beginManualCare', 'updateManualCare', 'cancelManualCare'];
  for (const name of actionNames) {
    Object.defineProperty(CharacterController.prototype, name, {
      value: function (...args) { return this.perform(name, ...args); }
    });
  }
  const cat = Object.freeze({
    id: 'wizard-cat', name: 'Wizard cat', type: 'svg',
    items: Object.freeze({food: 'fish', drink: 'water', toy: 'yarn'}),
    modes: Object.freeze(['docked', 'roaming']),
    renderers: Object.freeze({docked: mountDockedCat, roaming: mountRoamingCat})
  });
  const dog = Object.freeze({
    id: 'pomeranian', name: 'Pomeranian', type: '3d',
    items: Object.freeze({food: 'bone', drink: 'water', toy: 'ball'}),
    modes: Object.freeze(['docked', 'roaming']),
    renderers: Object.freeze({docked: mountDockedDog, roaming: mountRoamingDog})
  });
  const predefined = Object.freeze([cat, dog]);
  function mount(id, mode, container, options = {}) {
    const definition = predefined.find(entry => entry.id === id);
    if (!definition) throw new Error('Unknown predefined search character: ' + id);
    if (!definition.modes.includes(mode)) throw new Error('Unsupported character mode: ' + mode);
    const {renderer, actions, icons} = definition.renderers[mode](container, options);
    return new CharacterController(definition, mode, renderer, actions, icons);
  }
  function mountDockedCat(container, options) {
      const engine = typeof TypingCat !== 'undefined' ? TypingCat : root.TypingCat;
      const renderer = engine.mount(container, options.input);
      const actions = {};
      for (const name of ['setPersonality', 'searchCompleted', 'queryReset', 'giveCare',
        'beginManualCare', 'updateManualCare', 'cancelManualCare']) {
        actions[name] = (...args) => renderer[name](...args);
      }
      actions.play = () => renderer.playYarn();
      actions.react = mood => renderer.setMood(mood);
      return {renderer, actions, icons: {care: engine.careIcons, toy: engine.yarnIcon}};
  }
  function mountRoamingCat(container, options) {
      const engine = typeof WalkingCat !== 'undefined' ? WalkingCat : root.WalkingCat;
      const renderer = engine.mount(container, options);
      const actions = {};
      for (const name of ['walkTo', 'sit', 'stop', 'jump', 'setSpeed', 'setPosition',
        'getPosition', 'getPose', 'isHeld', 'drop']) {
        actions[name] = (...args) => renderer[name](...args);
      }
      actions.runTo = (x, y, mode = {}) => renderer.walkTo(x, y, {...mode, run: true});
      actions.lookAt = (...args) => renderer.watchAt(...args);
      actions.getBounds = () => renderer.element.querySelector('svg').getBoundingClientRect();
      return {renderer, actions, icons: {}};
  }
  function mountRoamingDog(container, options) {
    const engine=typeof RoamingDog!=='undefined'?RoamingDog:root.RoamingDog;
    const renderer=engine.mount(container,options),actions={};
    for(const name of ['walkTo','sit','sleep','wake','stop','jump','setSpeed','setPosition','getPosition','getPose','getBounds','isHeld','drop','setPersonality','setName'])actions[name]=(...args)=>renderer[name](...args);
    actions.runTo=(x,y,mode={})=>renderer.walkTo(x,y,{...mode,run:true});
    actions.lookAt=(...args)=>renderer.watchAt(...args);
    return {renderer,actions,icons:{}};
  }
  function mountDockedDog(container, options) {
    const engine = typeof Pomeranian !== 'undefined' ? Pomeranian : root.Pomeranian;
    const renderer = engine.mount(container, options);
    const actions = {};
    for (const name of ['blink', 'sit', 'sleep', 'wake', 'setName', 'setPersonality', 'searchCompleted', 'queryReset', 'giveCare', 'play', 'react', 'getPose', 'beginManualCare', 'updateManualCare', 'cancelManualCare']) {
      actions[name] = (...args) => renderer[name](...args);
    }
    return {renderer, actions, icons: {care: engine.careIcons, toy: engine.toyIcon}};
  }
  root.SearchCharacters = Object.freeze({predefined, mount});
  if (typeof module !== 'undefined' && module.exports) module.exports = root.SearchCharacters;
})(typeof globalThis !== 'undefined' ? globalThis : this);
