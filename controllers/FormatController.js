import { DefaultController } from './DefaultController'
import { SANCTIFICATION_TRAITS, ALIGNMENT_TRAITS } from '../constants/gametypes'

const ERRCODES = {
    0: 'F00', // Error: value is not valid, a string or longer than 0.
    1: 'F01', // Error: size is not valid, a string or longer than 0.
    2: 'F02', // Error: trait is not valid, a string or longer than 0.
}

export class FormatController extends DefaultController {
    constructor(isDev) {
        super(isDev)

    }
    
    getContrastColor(color, darkmode = false) {
        // RGBA_REGEX
        const colorValue = Math.round(((color.r * 299) + (color.g * 587) + (color.b * 114)) /1000);
        if (!!darkmode) {
            return colorValue > 125 && color.a > 0.5 ? 'color: rgba(0,0,0,0.8);' : 'color: rgb(255,255,255);'
        } else {
            return colorValue > 125 || color.a < 0.5 ? 'color: rgba(0,0,0,0.8);' : 'color: rgb(255,255,255);'
        }
        
    }

    getColorBlend(color1, color2, percentage) {
        color1 = color1 || '#000000';
        color2 = color2 || '#ffffff';
        percentage = percentage || 0.5;

        if (color1.length != 4 && color1.length != 7)
            return console.error('colors must be provided as hexes');

        if (color2.length != 4 && color2.length != 7)
            return console.error('colors must be provided as hexes');    

        if (percentage > 1 || percentage < 0)
            return console.error('percentage must be between 0 and 1');


        if (color1.length == 4)
            color1 = color1[1] + color1[1] + color1[2] + color1[2] + color1[3] + color1[3];
        else
            color1 = color1.substring(1);
        if (color2.length == 4)
            color2 = color2[1] + color2[1] + color2[2] + color2[2] + color2[3] + color2[3];
        else
            color2 = color2.substring(1);   

        color1 = [parseInt(color1[0] + color1[1], 16), parseInt(color1[2] + color1[3], 16), parseInt(color1[4] + color1[5], 16)];
        color2 = [parseInt(color2[0] + color2[1], 16), parseInt(color2[2] + color2[3], 16), parseInt(color2[4] + color2[5], 16)];

        var color3 = [ 
            (1 - percentage) * color1[0] + percentage * color2[0], 
            (1 - percentage) * color1[1] + percentage * color2[1], 
            (1 - percentage) * color1[2] + percentage * color2[2]
        ];

        color3 = '#' + this._int_to_hex(color3[0]) + this._int_to_hex(color3[1]) + this._int_to_hex(color3[2]);

        return color3;
    }

    _int_to_hex(num) {
        var hex = Math.round(num).toString(16);
        if (hex.length == 1)
            hex = '0' + hex;
        return hex;
    }

    capitalize(value) {
        if (!!value && typeof(value) == 'string' && value.length > 0) {
            return value.charAt(0).toUpperCase() + value.slice(1)
        } else {
            // this.warn(ERRCODES[0],`Error: value is not valid, a string or longer than 0.`)
            return null
        }
    }

    getPrettyIndex(index) {
        if (index == 0) {
            return '1st'
        } else if (index == 1) {
            return '2nd'
        } else if (index == 2) {
            return '3rd'
        } else if (index == 3) {
            return '4rd'
        } else {
            return (index+1)+'th'
        }
    }

    sizeBeautify(size) {
        if (!!size && typeof(size) == 'string' && size.length > 0) {
            switch(size) {
                case 'tiny':
                    return 'Tiny'
                case 'sm':
                    return 'Small'
                case 'med':
                    return 'Medium'
                case 'lg':
                    return 'Large'
                case 'huge':
                    return 'Huge'
                case 'grg':
                    return 'Gargantuan'
            }
        } else {
            this.error(ERRCODES[1],`Error: size is not valid, a string or longer than 0.`)
            return null
        }
    }

    otherLegacyColor() {
        return "purple lighten-1 white--text"
    }

    //double-duty for trait and legacy alignment since remaster has holy and unholy in traits and
    //we'll eventually remove legacy alignment (NN/CE/LG...) handling
    traitColor(trait) {
        if (!!trait && typeof(trait) == 'string' && trait.length > 0) {
            let traitLower = trait.toLowerCase()
            if (SANCTIFICATION_TRAITS.includes(traitLower) || 'sanctified' === traitLower) {
                return "blue lighten-1 white--text"
            } else if (ALIGNMENT_TRAITS.includes(traitLower)) {
                //due to certain amount of similarity for the concept, this is similar color as sanctification alignment
                return "blue lighten-3 white--text"
            } else {
                return "main lighten-1 white--text"
            }
        }
    }

    rarityColor(trait) {
        if (!!trait && typeof(trait) == 'string' && trait.length > 0) {
            if (trait == 'uncommon') {
                return "uncommon lighten-1 white--text"
            } else if (trait == 'rare') {
                return "rare lighten-1 white--text"
            } else if (trait == 'unique') {
                return "unique lighten-1 white--text"
            } else {
                return "main lighten-1 white--text"
            }
        } else {
            this.error(ERRCODES[2],`Error: trait is not valid, a string or longer than 0.`)
            return null
        }
    }

    actionNumber(item) {
        return item.actionType == 'action' || item.actionType.value == 'action' 
        ? (!!item.actions ? (!!item.actions.value ? item.actions.value : item.actions) : 1) 
        : (
            item.actionType == 'reaction' || item.actionType.value == 'reaction'
            ? 'r'
            : null
        )
    }

    hasActionNumber(item, parent = null) {
        return !!item && !!item.actionType && ((item.actionType == 'action' || item.actionType == 'reaction') || (item.actionType.value == 'action' || item.actionType.value == 'reaction'))
    }

    convertStatObjectToFlat(stats) {
        let newStats = {...stats}
        newStats.fortitude = !!newStats.saves ? newStats.saves[0] : 0
        newStats.reflex = !!newStats.saves ? newStats.saves[1] : 0
        newStats.will = !!newStats.saves ? newStats.saves[2] : 0
        delete newStats.saves

        newStats.strength = !!newStats.scores ? newStats.scores[0] : 10
        newStats.dexterity = !!newStats.scores ? newStats.scores[1] : 10
        newStats.constitution = !!newStats.scores ? newStats.scores[2] : 10
        newStats.intelligence = !!newStats.scores ? newStats.scores[3] : 10
        newStats.wisdom = !!newStats.scores ? newStats.scores[4] : 10
        newStats.charisma = !!newStats.scores ? newStats.scores[5] : 10
        delete newStats.scores

        newStats.acrobatics = !!newStats.skills ? newStats.skills[0] : 0
        newStats.arcana = !!newStats.skills ? newStats.skills[1] : 0
        newStats.athletics = !!newStats.skills ? newStats.skills[2] : 0
        newStats.crafting = !!newStats.skills ? newStats.skills[3] : 0
        newStats.deception = !!newStats.skills ? newStats.skills[4] : 0
        newStats.diplomacy = !!newStats.skills ? newStats.skills[5] : 0
        newStats.intimidation = !!newStats.skills ? newStats.skills[6] : 0
        newStats.lore = !!newStats.skills ? newStats.skills[7] : 0
        newStats.medicine = !!newStats.skills ? newStats.skills[8] : 0
        newStats.nature = !!newStats.skills ? newStats.skills[9] : 0
        newStats.occultism = !!newStats.skills ? newStats.skills[10] : 0
        newStats.performance = !!newStats.skills ? newStats.skills[11] : 0
        newStats.religion = !!newStats.skills ? newStats.skills[12] : 0
        newStats.society = !!newStats.skills ? newStats.skills[13] : 0
        newStats.stealth = !!newStats.skills ? newStats.skills[14] : 0
        newStats.survival = !!newStats.skills ? newStats.skills[15] : 0
        newStats.thievery = !!newStats.skills ? newStats.skills[16] : 0
        delete newStats.skills

        newStats.level = newStats.level || 1

        return newStats
    }

    convertStatFlatToObject(stats) {
        let newStats = {...stats}
        newStats.saves = [newStats.fortitude, newStats.reflex, newStats.will]
        delete newStats.fortitude
        delete newStats.reflex
        delete newStats.will

        newStats.scores = [
            newStats.strength || 10,
            newStats.dexterity || 10,
            newStats.constitution || 10,
            newStats.intelligence || 10,
            newStats.wisdom || 10,
            newStats.charisma || 10
        ]
        delete newStats.strength
        delete newStats.dexterity
        delete newStats.constitution
        delete newStats.intelligence
        delete newStats.wisdom
        delete newStats.charisma

        newStats.skills = [
            newStats.acrobatics || 0,
            newStats.arcana || 0,
            newStats.athletics || 0,
            newStats.crafting || 0,
            newStats.deception || 0,
            newStats.diplomacy || 0,
            newStats.intimidation || 0,
            newStats.lore || 0,
            newStats.medicine || 0,
            newStats.nature || 0,
            newStats.occultism || 0,
            newStats.performance || 0,
            newStats.religion || 0,
            newStats.society || 0,
            newStats.stealth || 0,
            newStats.survival || 0,
            newStats.thievery || 0,
        ]
        delete newStats.acrobatics
        delete newStats.arcana
        delete newStats.athletics
        delete newStats.crafting
        delete newStats.deception
        delete newStats.diplomacy
        delete newStats.intimidation
        delete newStats.lore
        delete newStats.medicine
        delete newStats.nature
        delete newStats.occultism
        delete newStats.performance
        delete newStats.religion
        delete newStats.society
        delete newStats.stealth
        delete newStats.survival
        delete newStats.thievery

        return newStats
    }

    get skillNames() { return SKILLS_NAMES }
    get skillIndexes() { return SKILLS_INDEX }
    skillScore(name) { return !!name && typeof(name) == 'string' ? SKILLS_ABILITY_SCORE[name] : null }
    skillScoreShort(name) { return !!this.skillScore(name) ? this.skillScore(name).substr(0,3) : null }
    skillBeautify(name) { return !!name && typeof(name) == 'string' && !!SKILLS_NAMES_LONG[name] ? SKILLS_NAMES_LONG[name] : null}

    get scoreNames() { return ABILITY_SCORE_NAMES }
    get scoreNamesShort() { return ABILITY_SCORE_NAMES_SHORT }
    get scoreIndexes() { return ABILITY_SCORE_INDEX }
    getSkillScore(skill) { return !!skill && typeof(skill) == 'string' && !!this.skillScore(skill) && (!!this.scoreIndexes[this.skillScore(skill)] || this.scoreIndexes[this.skillScore(skill)] == 0) ? this.scoreIndexes[this.skillScore(skill)] : null }
    abilityBeautify(name) { return !!name && typeof(name) == 'string' && !!ABILITY_SCORE_LONG[name] ? ABILITY_SCORE_LONG[name] : null}

    get saveNames() { return SAVES_NAMES }
    get saveIndexes() { return SAVES_INDEX }
    saveScore(name) { return !!name && typeof(name) == 'string' ? SAVES_ABILITY_SCORE[name] : null }
    saveScoreShort(name) { return !!this.saveScore(name) ? this.saveScore(name).substr(0,3) : null }

    proficiencyBonus(level, proficiency) {return proficiency > 0 ? level + (proficiency*2) : 0}
    proficiencyType(proficiency) {
        if (!!proficiency) {
            if (proficiency == 1) {
                return 'Trained'
            } else if (proficiency == 2) {
                return 'Expert'
            } else if (proficiency == 3) {
                return 'Master'
            } else if (proficiency == 4) {
                return 'Legendary'
            }
        }
        return 'Untrained'
    }
    proficiencyTypeShort(proficiency) {
        if (!!proficiency) {
            if (proficiency == 1) {
                return 'T'
            } else if (proficiency == 2) {
                return 'E'
            } else if (proficiency == 3) {
                return 'M'
            } else if (proficiency == 4) {
                return 'L'
            }
        }
        return ''
    }
    proficiencyTypeIcon(proficiency) {
        if (!!proficiency) {
            if (proficiency == 1) {
                return 'mdi-circle-slice-2'
            } else if (proficiency == 2) {
                return 'mdi-circle-slice-4'
            } else if (proficiency == 3) {
                return 'mdi-circle-slice-6'
            } else if (proficiency == 4) {
                return 'mdi-circle-slice-8'
            }
        }
        return ''
    }

    getAbilityScoreModifier(score) {
        return !!score ? Math.floor((score-10)/2) : 0
    }
    getSkillModifier(score, level, proficiency) {
        return this._getProficiencyModifier(score, level, proficiency)
    }
    getSaveModifier(score, level, proficiency) {
        return this._getProficiencyModifier(score, level, proficiency)
    }

    _getProficiencyModifier(score, level, proficiency) {
        return (!!score || score == 0) && !!level && (!!proficiency || proficiency == 0) ? score + this.proficiencyBonus(level, proficiency) : 0
    }

    compareByLevel(a, b) {
        if (a.level < b.level) {
            return -1
        } else if (a.level > b.level) {
            return 1
        } else if (!!a.text && !!b.text) {
            if (a.text.toLowerCase() < b.text.toLowerCase()) {
                return -1
            } else if (a.text.toLowerCase() > b.text.toLowerCase()) {
                return 1
            } else {
                return -1
            }
        } else {
            return -1
        }
    }

    compareByText(a, b) {
        if (a.text.toLowerCase() < b.text.toLowerCase()) {
            return -1
        } else if (a.text.toLowerCase() > b.text.toLowerCase()) {
            return 1
        } else if (!!a.level && !!b.level) {
            if (a.level < b.level) {
                return -1
            } else if (a.level > b.level) {
                return 1
            } else {
                return -1
            }
        } else {
            return -1
        }
    }

    compareByName(a, b) {
        if (a.name.toLowerCase() < b.name.toLowerCase()) {
            return -1
        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
            return 1
        } else {
            return -1
        }
    }
}

const ABILITY_SCORE_INDEX = {
    'strength': 0,
    'str': 0,
    'dexterity': 1,
    'dex': 1,
    'constitution': 2,
    'con': 2,
    'intelligence': 3,
    'int': 3,
    'wisdom': 4,
    'wis': 4,
    'charisma': 5,
    'cha': 5,
}
const ABILITY_SCORE_NAMES = [
    'strength','dexterity','constitution','intelligence','wisdom','charisma'
]
const ABILITY_SCORE_NAMES_SHORT = [
    'str','dex','con','int','wis','cha'
]
const ABILITY_SCORE_LONG = {
    'str': 'Strength',
    'dex': 'Dexterity',
    'con': 'Constitution',
    'int': 'Intelligence',
    'wis': 'Wisdom',
    'cha': 'Charisma',
}
const SAVES_INDEX = {
    'fortitude': 0,
    'fort': 0,
    'reflex': 1,
    'refl': 1,
    'will': 2,
}
const SAVES_NAMES = [
    'fortitude','reflex','will'
]
const SAVES_ABILITY_SCORE = {
    'perception': 'wisdom',
    'fortitude': 'constitution',
    'reflex': 'dexterity',
    'will': 'wisdom',
}
const SKILLS_INDEX = {
    'acrobatics': 0,
    'arcana': 1,
    'athletics': 2,
    'crafting': 3,
    'deception': 4,
    'diplomacy': 5,
    'intimidation': 6,
    'lore': 7,
    'medicine': 8,
    'nature': 9,
    'occultism': 10,
    'performance': 11,
    'religion': 12,
    'society': 13,
    'stealth': 14,
    'survival': 15,
    'thievery': 16,
}
const SKILLS_NAMES = [
    'acrobatics','arcana','athletics','crafting','deception','diplomacy','intimidation','lore','medicine','nature','occultism','performance','religion','society','stealth','survival','thievery',
]
const SKILLS_ABILITY_SCORE = {
    'acrobatics': 'dexterity',
    'arcana': 'intelligence',
    'athletics': 'strength',
    'crafting': 'intelligence',
    'deception': 'charisma',
    'diplomacy': 'charisma',
    'intimidation': 'charisma',
    'lore': 'intelligence',
    'medicine': 'wisdom',
    'nature': 'wisdom',
    'occultism': 'intelligence',
    'performance': 'charisma',
    'religion': 'wisdom',
    'society': 'intelligence',
    'stealth': 'dexterity',
    'survival': 'wisdom',
    'thievery': 'dexterity',
}
const SKILLS_NAMES_LONG = {
    'acr':'acrobatics',
    'arc':'arcana',
    'ath':'athletics',
    'cra':'crafting',
    'dec':'deception',
    'dip':'diplomacy',
    'int':'intimidation',
    'lor':'lore',
    'med':'medicine',
    'nat':'nature',
    'occ':'occultism',
    'per':'performance',
    'rel':'religion',
    'soc':'society',
    'ste':'stealth',
    'sur':'survival',
    'thi':'thievery',
}