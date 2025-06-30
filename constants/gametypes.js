export const dmgTypes = [
    {type: 'untypes', value: 'untyped', text: 'Untyped'},
    {type: 'acid', value: 'acid', text: 'Acid'}, 
    {type: 'bleed', value: 'bleed', text: 'Bleed'}, 
    {type: 'bludgeoning', value: 'bludgeoning', text: 'Bludgeoning'}, 
    {type: 'chaotic', value: 'chaotic', text: 'Chaotic'}, 
    {type: 'cold', value: 'cold', text: 'Cold'}, 
    {type: 'electricity', value: 'electricity', text: 'Electricity'}, 
    {type: 'evil', value: 'evil', text: 'Evil'}, 
    {type: 'fire', value: 'fire', text: 'Fire'}, 
    {type: 'force', value: 'force', text: 'Force'}, 
    {type: 'good', value: 'good', text: 'Good'}, 
    {type: 'lawful', value: 'lawful', text: 'Lawful'}, 
    {type: 'mental', value: 'mental', text: 'Mental'}, 
    {type: 'negative', value: 'negative', text: 'Negative'}, 
    {type: 'piercing', value: 'piercing', text: 'Piercing'}, 
    {type: 'poison', value: 'poison', text: 'Poison'}, 
    {type: 'positive', value: 'positive', text: 'Positive'}, 
    {type: 'slashing', value: 'slashing', text: 'Slashing'}, 
    {type: 'sonic', value: 'sonic', text: 'Sonic'}
]

export const healTypes = [
    {type: 'regular', value: 'regular', text: 'Regular'},
    {type: 'temporary', value: 'temporary', text: 'Temporary'},
]

export const conditionTypes = [
    {type: 'blinded', value: 'blinded', text: 'Blinded'},
    {type: 'broken', value: 'broken', text: 'Broken'},
    {type: 'concealed', value: 'concealed', text: 'Concealed'},
    {type: 'confused', value: 'confused', text: 'Confused'},
    {type: 'controlled', value: 'controlled', text: 'Controlled'},
    {type: 'clumsy', value: 'clumsy', text: 'Clumsy'},
    {type: 'dazzled', value: 'dazzled', text: 'Dazzled'},
    {type: 'deafened', value: 'deafened', text: 'Deafened'},
    {type: 'doomed', value: 'doomed', text: 'Doomed'},
    {type: 'drained', value: 'drained', text: 'Drained'},
    {type: 'dying', value: 'dying', text: 'Dying'},
    {type: 'encumbered', value: 'encumbered', text: 'Encumbered'},
    {type: 'enfeebled', value: 'enfeebled', text: 'Enfeebled'},
    {type: 'fascinated', value: 'fascinated', text: 'Fascinated'},
    {type: 'fatigued', value: 'fatigued', text: 'Fatigued'},
    {type: 'fleeing', value: 'fleeing', text: 'Fleeing'},
    {type: 'frightened', value: 'frightened', text: 'Frightened'},
    {type: 'grabbed', value: 'grabbed', text: 'Grabbed'},
    {type: 'hidden', value: 'hidden', text: 'Hidden'},
    {type: 'immobilized', value: 'immobilized', text: 'Immobilized'},
    {type: 'invisible', value: 'invisible', text: 'Invisible'},
    {type: 'off-guard', value: 'off-guard', text: 'Off-Guard'},
    {type: 'paralyzed', value: 'paralyzed', text: 'Paralyzed'},
    {type: 'petrified', value: 'petrified', text: 'Petrified'},
    {type: 'prone', value: 'prone', text: 'Prone'},
    {type: 'quickened', value: 'quickened', text: 'Quickened'},
    {type: 'restrained', value: 'restrained', text: 'Restrained'},
    {type: 'sickened', value: 'sickened', text: 'Sickened'},
    {type: 'slowed', value: 'slowed', text: 'Slowed'},
    {type: 'stupified', value: 'stupified', text: 'Stupified'},
    {type: 'stunned', value: 'stunned', text: 'Stunned'},
    {type: 'unconscious', value: 'unconscious', text: 'Unconscious'},
    {type: 'undetected', value: 'undetected', text: 'Undetected'},
    {type: 'unnoticed', value: 'unnoticed', text: 'Unnoticed'},
    {type: 'wounded', value: 'wounded', text: 'Wounded'},
]

export const SIZE_CATEGORIES = ['tiny','small','medium','large','huge','gargantuan']

//traits
//these first three consts are from
//https://github.com/foundryvtt/pf2e/blob/fdc144d0ca5cfd207aa1832ef15c0eb263f1ae3d/src/scripts/config/traits.ts
//TODO: we should start importing these (first three consts) from vtt pf2e data rather than hard-coding them here
export const ELEMENT_TRAITS = ['air','earth','fire','metal','water','wood']
export const ENERGY_DAMAGE_TYPES_TRAITS = ['acid','cold','electricity','fire','force','sonic','vitality','void']
export const SANCTIFICATION_TRAITS = ['holy','unholy']
//many of the below alignments (especially towards the end of the list) are legacy and will probably be removed soon
export const ALIGNMENT_TRAITS = ['evil','good','chaotic','lawful','neutral','n','g','nn','ne','lg','ln','le','cg','ce','cn']
