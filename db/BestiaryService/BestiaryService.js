const EventEmitter = require('events')
import { set, get, del } from 'idb-keyval';
import { Octokit, App } from "octokit";
import { Buffer } from "buffer";
import BestiaryParser from './BestiaryServiceParsing'


const octokit = new Octokit({
    userAgent: "ready-set-dice/v1.0.0",
});

const bestiaryURLEndings = [
    'bestiary1',
    'bestiary2',
    'bestiary3',
    'abomination_vaults_bestiary',
    'agents_of_edgewatch_bestiary',
    'age_of_ashes_bestiary',
    'blog_bestiary',
    'blood_lords_bestiary',
    'book_of_the_dead_bestiary',
    'crown_of_the_kobold_king_bestiary',
    'extinction_curse_bestiary',
    'fall_of_plaguestone',
    'fists_of_the_ruby_phoenix_bestiary',
    'gatewalkers_bestiary',
    'impossible_lands_bestiary',
    'malevolence_bestiary',
    'menace_under_otari_bestiary',
    'monsters_of_myth_bestiary',
    'mwangi_expanse_bestiary',
    'night_of_the_gray_death_bestiary',
    'kingmaker_bestiary',
    'npc_gallery',
    'one_shot_bestiary',
    'outlaws_of_alkenstar_bestiary',
    'pathfinder_dark_archive',
    'pfs_introductions_bestiary',
    'pfs_season_1_bestiary',
    'pfs_season_2_bestiary',
    'pfs_season_3_bestiary',
    'quest_for_the_frozen_flame_bestiary',
    'shadows_at_sundown_bestiary',
    'stolen_fate_bestiary',
    'strength_of_thousands_bestiary',
    'the_enmity_cycle_bestiary',
    'the_slithering_bestiary',
    'travel_guide_bestiary',
    'troubles_in_otari_bestiary',
    'hazards_bestiary',
    'custom_bestiary'
]

class BestiaryService extends EventEmitter {
    constructor() {
        super()
    }

    init(store, SpellService, StaticService) {
        // console.log("Init BestiaryService")
        this.$store = store
        this.SpellService = SpellService
        this.StaticService = StaticService
        BestiaryParser.init(StaticService)

        this.SpellService.on('NamePairSet', () => {
            this.load()
        })
        
    }

    reset() {
        this.ref = {}
        this.bestiaryCount = 0
        this.creatureCount = 0
        bestiaryURLEndings.forEach((b) => {
            this.ref[b] = []
            this.bestiaryCount += 1
        })

        this.namePair = []
        this.extendedNamePair = []
        this.searchNamePair = []

        //needed? - determine if stats.data.details.creatureType is actually consumed
        this.stats = {
            data: {
                details: {
                    creatureType: [],
                    source: {
                        adventure: [],
                        adventurePaths: [],
                        blog: [],
                        bounty: [],
                        core: [],
                        lostOmens: [],
                        oneShot: [],
                        societyQuest: [],
                        societyScenario1: [],
                        societyScenario2: [],
                        societyScenario3: [],
                        society: [],
                        custom: [],
                    }
                }
            }
        }
    }

    load() {
        this.reset()

        if (this.$store.getters['pf2e/bestiary'].version != 0 && this.$store.getters['pf2e/bestiary'].count != 0) {
            let customBestiary = this.$store.getters['pf2e/cbestiary']
            let offset = !!customBestiary.version && !!customBestiary.count ? 0 : 1
            let count = 0

            let totalCreatureCount = 0
            bestiaryURLEndings.forEach((b) => {
                get(b).then(val => {
                    if (!!val) {
                        this.ref[b] = val
                        count += 1
                        totalCreatureCount += val.length

                        // Minus 1 because custom_bestiary could be empty!
                        if (count == this.bestiaryCount - offset) {
                            this.creatureCount = totalCreatureCount

                            this.emit('Set')
                            this.loadNamePair()
                            this.loadCreatureTypes()
                            this.loadSources()
                        }
                    }
                })
            })
        }
    }

    loadNamePair() {
        let count = 0
        this.namePair = []
        this.extendedNamePair = []
        this.searchNamePair = []

        Object.keys(this.ref).forEach(k => {
            this.ref[k].forEach(b => {
                if (!!b && !!b.system) {
                    let pair = {
                        name: b.name,
                        id: b._id,
                        _id: b._id,
                        type: b.type,
                        db: k
                    }

                    this.namePair.push(pair)

                    let traits = !!b.system.traits && !!b.system.traits.value ? b.system.traits.value : []
                    this.adjustAlignment(traits, b.system.details.alignment)

                    let description = ''

                    if (b.type == 'hazard') {
                        description = !!b.system.details.description ? b.system.details.description : ''
                        if (!traits.includes('trap')) {
                            traits.push('trap')
                        }
                        if (!traits.includes('hazard')) {
                            traits.push('hazard')
                        }
                    } else {
                        description = !!b.system.details.privateNotes ? b.system.details.privateNotes : ''
                    }

                    let extendedPair = {
                        ...pair,
                        level: b.system.details.level.value,
                        size: !!b.system.traits.size && !!b.system.traits.size.value ? b.system.traits.size.value : {value: 'med'},
                        rarity: b.system.traits.rarity,
                        traits: traits,
                        source: '',
                    }

                    if (b.system.details.source && !!b.system.details.source.value) {
                        extendedPair.source = b.system.details.source.value
                    } else if (b.system.source && !!b.system.source.value) {
                        extendedPair.source = b.system.source.value
                    }

                    let searchPair = {
                        ...extendedPair,
                        ds: description,
                        am: false,
                        aq: false,
                        cs: false,
                    }

                    if (!!b.items && b.items.length > 0) {
                        let itemNames = []
                        let abilityNames = []
                        let spellNames = []
                        b.items.forEach(item => {
                            if (!!item && !!item.name) {
                                if (item.type == 'spell') {
                                    spellNames.push(item.name)
                                    searchPair.cs = true
                                } else if (item.type == 'spellcastingEntry') {
                                    abilityNames.push(item.name)
                                    searchPair.cs = true
                                } else if (item.type == 'melee' || item.type == 'action' || item.type == 'effect') {
                                    abilityNames.push(item.name)
                                } else if (item.type == 'consumable' || item.type == 'equipment' || item.type == 'weapon' || item.type == 'armor' || item.type == 'treasure' || item.type == 'backpack') {
                                    itemNames.push(item.name)
                                }
                            }
                        })

                        if (!!itemNames && itemNames.length > 0) {
                            searchPair.it = itemNames
                        }
                        if (!!abilityNames && abilityNames.length > 0) {
                            searchPair.ab = abilityNames
                        }
                        if (!!spellNames && spellNames.length > 0) {
                            searchPair.sp = spellNames
                        }
                    }

                    if (!!traits && traits.length > 0) {
                        if (traits.includes("amphibious")) {
                            searchPair.am = true
                        }
                        if (traits.includes("aquatic")) {
                            searchPair.aq = true
                        }
                    }

                    let immunity = null
                    if (!!b.system.attributes.immunities && b.system.attributes.immunities.length > 0) {
                        b.system.attributes.immunities.forEach(im => {
                            if (!!im && !!im.type) {
                                if (!!immunity) {
                                    immunity.push(im.type)
                                } else {
                                    immunity = [im.type]
                                }
                            }
                        })
                    }

                    if (!!immunity && immunity.length > 0) {
                        searchPair.im = immunity
                    }

                    let resistance = null
                    if (!!b.system.attributes.resistances && b.system.attributes.resistances.length > 0) {
                        resistance = []
                        b.system.attributes.resistances.forEach(resist => {
                            if (!!resist && !!resist.type) {
                                if (!!resist.exceptions) {
                                    resistance.push(resist.type+':'+resist.exceptions)
                                } else {
                                    resistance.push(resist.type)
                                }
                            }
                        })
                    }

                    if (!!resistance && resistance.length > 0) {
                        searchPair.rs = resistance
                    }

                    let weakness = null
                    if (!!b.system.attributes.weaknesses && b.system.attributes.weaknesses.length > 0) {
                        weakness = []
                        b.system.attributes.weaknesses.forEach(weak => {
                            if (!!weak && !!weak.type) {
                                weakness.push(weak.type)
                            }
                        })
                    }

                    if (!!weakness && weakness.length > 0) {
                        searchPair.wk = weakness
                    }

                    this.extendedNamePair.push(extendedPair)
                    this.searchNamePair.push(searchPair)
                }

                count += 1

                if (count == this.creatureCount) {
                    this.emit('NamePairSet')
                }
            })
        })
    }

    //if alignment actually has a value, we (expand it from something
    //like 'CG' to 'CHAOTIC GOOD' and) add it to the traits.
    adjustAlignment(traits, alignment) {
        if (!!alignment?.value) {
            let alignmentLower = alignment.value.toLowerCase()
            if (['lg','ln','le','lawful'].includes(alignmentLower) && !traits.includes('lawful'))
                traits.push('lawful')
            if (['cg','cn','ce','chaotic'].includes(alignmentLower) && !traits.includes('chaotic'))
                traits.push('chaotic')
            if (['ng','nn','ne','ln','cn','n','neutral'].includes(alignmentLower) && !traits.includes('neutral'))
                traits.push('neutral')
            if (['lg','ng','cg','good'].includes(alignmentLower) && !traits.includes('good'))
                traits.push('good')
            if (['le','ne','ce','evil'].includes(alignmentLower) && !traits.includes('evil'))
                traits.push('evil')
        }
    }

    flushCustomCreatures() {
        if (!!this.store && !!this.$store.getters) {
            const newCustomBestiary = {
                count: 0,
                version: 0
            }
            this.$store.dispatch('pf2e/setCustomBestiaryInfo', {...newCustomBestiary})
            del('custom_bestiary')
        }
    }

    loadCustomCreatures(owner, repo) {
        if (!!owner && !!repo) {
            const versionCheck = octokit.rest.repos.getContent({
                owner: owner,
                repo: repo,
                path: "version",
            });
    
            get('custom_bestiary').then(val => {
                versionCheck
                .then(version => {
                    if (!!version && !!version.status && version.status == 200 && !!version.data && !!version.data.content) {
                        let remoteVersion = this.getGithubVersion(version.data.content)
                        let customBestiary = this.$store.getters['pf2e/cbestiary']
    
                        if (!val || remoteVersion > customBestiary.version) {
                            const result = octokit.rest.repos.getContent({
                                owner: owner,
                                repo: repo,
                            });
    
                            let customCreatures = []
                            let customCount = 0
                            let JSONcount = 0
    
                            // console.log(val, remoteVersion, customBestiary.version)
    
                            result.then(res => {
                                if (!!res && !!res.status && res.status == 200) {
                                    if (!!res.data && res.data.length > 0) {
                                        res.data.forEach(d => {
                                            if (!!d && !!d.name && !!d.path) {
                                                let json_file = d.name.split('.')
                                                if (json_file[json_file.length-1].toLowerCase() == 'json') {
                                                    JSONcount += 1
    
                                                    const creature_result = octokit.rest.repos.getContent({
                                                        owner: owner,
                                                        repo: repo,
                                                        path: d.path,
                                                    });
    
                                                    creature_result.then(cres => {
                                                        if (!!cres && !!cres.status && cres.status == 200) {
                                                            if (!!cres.data && !!cres.data.content) {
                                                                customCreatures.push(this.convertCustomToFoundry(cres.data.content))
                                                                customCount += 1
    
                                                                if (JSONcount == customCount) {
                                                                    const newCustomBestiary = {
                                                                        count: customCount,
                                                                        version: remoteVersion,
                                                                        owner: owner,
                                                                        git: repo,
                                                                    }
    
                                                                    this.$store.dispatch('pf2e/setCustomBestiaryInfo', {...newCustomBestiary})
                                                                    set('custom_bestiary', customCreatures)
                                                                    this.load()
                                                                }
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
                .catch(error => {
                    this.flushCustomCreatures()
                })
            })
        } else {
            this.flushCustomCreatures()
        }
    }

    getGithubVersion(base64) {
        let versionNumber = -1
        if (!!base64) {
            const verBuff = Buffer.from(base64, 'base64');
            const verStr = verBuff.toString('utf-8');
            versionNumber = Number(verStr)
        }
        return versionNumber
    }

    getBestiaries() {
        return bestiaryURLEndings
    }

    getRef() {
        return this.ref
    }

    getNamePair() {
        return this.namePair
    }

    getExtendedNamePair() {
        return this.extendedNamePair
    }

    getSearchNamePair() {
        return this.searchNamePair
    }

    getCreaturesOfLevel(level) {
        let creatures = []
        Object.keys(this.ref).forEach(k => {
            creatures = creatures.concat(this.ref[k].filter(b => Number(b.system.details.level.value) == Number(level) ))
        })

        return creatures
    }

    getCreatureByName(name, db = null) {
        let found = null

        if (this.ref) {
            if (db) {
                found = this.ref[db].find(b => {
                    return b.name == name
                })
            } else {

                Object.keys(this.ref).forEach(k => {
                    if (!found) {
                        found = this.ref[k].find(b => {
                            return b.name == name
                        })
                    }
                })
            }
        }

        // console.log("Found: ", found)

        if (found) {
            found.db = db
            found = BestiaryParser.parseBeast(found)
        }
        return found
    }

    getCreature(id, db = null) {
        let found = null

        if (this.ref) {
            if (db) {
                found = this.ref[db].find(b => {
                    return b._id == id
                })
            } else {

                Object.keys(this.ref).forEach(k => {
                    if (!found) {
                        found = this.ref[k].find(b => {
                            return b._id == id
                        })
                    }
                })
            }
        }

        // console.log("Found: ", found)

        if (found) {
            found.db = db
            found = BestiaryParser.parseBeast(found)
        }
        return found
    }

    /* Client side parsing */
    regexRemove(description) {
        description = removeCompendiumString(description)
        description = removeTemplateString(description)
        description = removeCheckString(description)
        description = removeDamageString(description)
        description = removeTimeString(description)
    
        return description
    }

    /* Specific filters */
    capitalize(item) {
        return !!item && item.length > 0 ? item.charAt(0).toUpperCase() + item.slice(1) : ''
    }

//TODO- is this loadCreatureTypes() even really used any longer?
//      just for debugging, maybe?  I don't see a call to getCreatureTypes() (i.e.
//      I don't see any use of stats.data.details.creatureType- which is what this method produces).
//      And, with recent changes to vtt pf2e data, it turns out this is only really doing anything
//      for custom creature info in older format.
    //load known creature types into stats.data.details.creatureType
    loadCreatureTypes() {
        let allCreatureTypesForAllBeasts = []

        if (this.ref) {
            //for each bestiary (which can have multiple beasts each with multiple creature types)
            Object.keys(this.ref).forEach(k => {
                this.ref[k].forEach(b => {
                    if (!!b?.system?.details?.creatureType)
                        allCreatureTypesForAllBeasts.push(...this.simpleCreatureTypes(b?.system?.details?.creatureType))
                })
            })
        }

        this.stats.data.details.creatureType = allCreatureTypesForAllBeasts

        // Fix the fact there is no "Hazard/Trap" creatureType
        this.stats.data.details.creatureType.push("Trap")
        this.stats.data.details.creatureType.sort((a,b) => {
            return a.localeCompare(b)
        })

        this.emit('CreatureTypeSet')
    }

    getCreatureTypes () {
        return !!this.stats ? [...this.stats.data.details.creatureType] : []
    }

    //Foundry vtt pf2e data does not actually have creature type data any longer but we still read from legacy exports.
    //Given a beast's comma-separated system.details.creatureType value
    //return an array with lower case creature types
    simpleCreatureTypes(commaSeparatedCreatureTypes) {
        if (!commaSeparatedCreatureTypes || typeof commaSeparatedCreatureTypes !== 'string')
            return []
        console.log(commaSeparatedCreatureTypes)
        return commaSeparatedCreatureTypes
                .split(",")
                .map(str => str.trim().toLowerCase())
                .filter(str => str !== "")
    }


    loadSources() {
        let fieldParts = [
            'system',
            'details',
            'source',
            'value'
        ]

        let fieldHazardParts = [
            'system',
            'source',
            'value'
        ]

        let stats = {
            adventure: [],
            adventurePaths: [],
            blog: [],
            bounty: [],
            core: [],
            lostOmens: [],
            oneShot: [],
            societyQuest: [],
            societyScenario1: [],
            societyScenario2: [],
            societyScenario3: [],
            society: [],
            custom: [],
            // uncategorized: [],
        }

        if (this.ref) {
            Object.keys(this.ref).forEach(k => {
                this.ref[k].forEach(b => {
                    let beastValue = b
                    let hasField = true
                    let hazard = false

                    fieldParts.forEach(fp => {
                        if (!!beastValue && !!beastValue[fp] && hasField) {
                            beastValue = beastValue[fp]
                        } else {
                            beastValue = null
                            hasField = false
                        }
                    })

                    if (!beastValue && !hasField) {
                        beastValue = b
                        hasField = true
                        hazard = true
                        fieldHazardParts.forEach(fp => {
                            if (!!beastValue && !!beastValue[fp] && hasField) {
                                beastValue = beastValue[fp]
                            } else {
                                beastValue = null
                                hasField = false
                            }
                        })
                    }

                    if (!!beastValue) {
                        // if (!!hazard) {
                        //     console.log(beastValue)
                        // }
                        beastValue = beastValue.replace('Pathfinder ','')

                        if (beastValue.toLowerCase().includes('lost omens')) {
                            if (!stats.lostOmens.includes(beastValue)) { stats.lostOmens.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('one-shot')) {
                            if (!stats.oneShot.includes(beastValue)) { stats.oneShot.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('society') && beastValue.toLowerCase().includes('quest')) {
                            if (!stats.societyQuest.includes(beastValue)) { stats.societyQuest.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('society') && beastValue.toLowerCase().includes('scenario') && beastValue.toLowerCase().includes('1-')) {
                            if (!stats.societyScenario1.includes(beastValue)) { stats.societyScenario1.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('society') && beastValue.toLowerCase().includes('scenario') && beastValue.toLowerCase().includes('2-')) {
                            if (!stats.societyScenario2.includes(beastValue)) { stats.societyScenario2.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('society') && beastValue.toLowerCase().includes('scenario') && beastValue.toLowerCase().includes('3-')) {
                            if (!stats.societyScenario3.includes(beastValue)) { stats.societyScenario3.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('society')) {
                            if (!stats.society.includes(beastValue)) { stats.society.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('adventure') && !beastValue.toLowerCase().includes('adventure path')) {
                            if (!stats.adventure.includes(beastValue)) { stats.adventure.push(beastValue) }
                        } else if (beastValue.toLowerCase().includes('bounty')) {
                            if (!stats.bounty.includes(beastValue)) { stats.bounty.push(beastValue) }
                        } else if ((beastValue.toLowerCase().includes('#') || beastValue.toLowerCase().includes('adventure path #') || beastValue.toLowerCase().includes('punks in a powder keg'))) {
                            if (!stats.adventurePaths.includes(beastValue.replace('Adventure Path ',''))) { stats.adventurePaths.push(beastValue.replace('Adventure Path ','')) }
                        } else if (beastValue.toLowerCase().includes('blog')) {
                            if (!stats.blog.includes(beastValue)) { stats.blog.push(beastValue) }
                        } else if ((beastValue.toLowerCase().includes('bestiary') || beastValue.toLowerCase().includes('core') || beastValue.toLowerCase().includes('gamemastery') || beastValue.toLowerCase().includes('beginner')  || beastValue.toLowerCase().includes('book of the dead'))) {
                            if (!stats.core.includes(beastValue)) { stats.core.push(beastValue) }
                        } else if (beastValue.toLowerCase() == 'custom') {
                            if (!stats.custom.includes(beastValue)) { stats.core.push(beastValue) }
                        }
                        
                    }

                })
            })
        }

        Object.keys(stats).forEach(s => {
            stats[s] = stats[s].sort((a,b) => {
                return a.localeCompare(b)
            })
        })

        this.stats.data.details.source = stats
        
        this.emit('SourceSet')
    }

    getSources () {
        return !!this.stats ? {...this.stats.data.details.source} : {}
    }

    convertCustomToFoundry(base64) {
        const buff = Buffer.from(base64, 'base64');
        const str = buff.toString('utf-8');
    
        const customJSON = JSON.parse(str)

        // Check if this is a foundry JSON format
        if (!!customJSON && !!customJSON.system && !!customJSON.system.attributes && !!customJSON.system.details && !!customJSON.system.saves && !!customJSON.system.traits && !!customJSON.items && !!customJSON.name) {
            return customJSON
        }
    
        const speedSplit = !!customJSON?.speed?.split ? customJSON.speed.split(',') : []
        let movespeed = 25
        let otherSpeeds = []
        
        if (!!speedSplit && speedSplit.length > 0) {
            speedSplit.forEach(s => {
                if (s.toLowerCase().includes('fly')) {
                    let speed = Number(!!s ? s.replace(/[^0-9]/g, '') : 25)
                    otherSpeeds.push({
                        "type": "fly",
                        "value": speed
                    })
                } else if (s.toLowerCase().includes('swim')) {
                    let speed = Number(!!s ? s.replace(/[^0-9]/g, '') : 25)
                    otherSpeeds.push({
                        "type": "swim",
                        "value": speed
                    })
                } else if (s.toLowerCase().includes('climb')) {
                    let speed = Number(!!s ? s.replace(/[^0-9]/g, '') : 25)
                    otherSpeeds.push({
                        "type": "climb",
                        "value": speed
                    })
                } else if (s.toLowerCase().includes('feet')) {
                    movespeed = Number(!!s ? s.replace(/[^0-9]/g, '') : 25)
                }
            })
        }
    
        let immunity = []
        if (!!customJSON && !!customJSON.immunity && !!customJSON.immunity.value) {
            const immunitySplit = customJSON.immunity.value.replaceAll(' ','').split(',')
            immunitySplit.forEach(i => {
                if (!!i) {
                    immunity.push({
                        type: i,
                    })
                }
            })
        }

        let resistance = []
        if (!!customJSON && !!customJSON.resistance && !!customJSON.resistance.value) {
            const resistanceSplit = customJSON.resistance.value.replaceAll(', ',',').split(',')
            resistanceSplit.forEach(i => {
                let resisSplit = i.split(' ')
                if (!!resisSplit && resisSplit.length == 2) {
                    resistance.push({
                        type: resisSplit[0],
                        value: Number(resisSplit[1])
                    })
                } else if (!!resisSplit && resisSplit.length == 1) {
                    resistance.push({
                        type: 'generic',
                        value: Number(resisSplit[0])
                    })
                }
            })
        }
        let weakness = []
        if (!!customJSON && !!customJSON.weakness && !!customJSON.weakness.value) {
            const weaknessSplit = customJSON.weakness.value.replaceAll(', ',',').split(',')
            weaknessSplit.forEach(i => {
                let weakSplit = i.split(' ')
                if (!!weakSplit && weakSplit.length == 2) {
                    weakness.push({
                        type: weakSplit[0],
                        value: Number(weakSplit[1])
                    })
                } else if (!!weakSplit && weakSplit.length == 3) {
                    weakness.push({
                        type: weakSplit[0] + " " + weakSplit[1],
                        value: Number(weakSplit[2])
                    })
                } else if (!!weakSplit && weakSplit.length == 1) {
                    weakness.push({
                        type: 'generic',
                        value: Number(weakSplit[0])
                    })
                }
            })
        }

        let languages = this.parseSimpleArray(customJSON.languages)

        //put the legacy comma-separated creatureType values into the traits (that's how we want it in remaster)
        let customBeastTraits = this.parseSimpleArray(customJSON.traits)
        let beastCreatureTypes = this.simpleCreatureTypes(customJSON?.creatureType)
        beastCreatureTypes.forEach(t => {
            if (!customBeastTraits.includes(t))
                customBeastTraits.push(t)
        })

        let items = []
    
        // Actions
        if (!!customJSON && !!customJSON.specials && customJSON.specials.length > 0) {
            customJSON.specials.forEach(s => {
                let actionType = ""
                let actions = null
                if (!!s.actions) {
                    switch(s.actions) {
                        case "none":
                            actionType = "passive"
                            break;
                        case "reaction":
                            actionType = "reaction"
                            break;
                        case "one":
                            actionType = "action"
                            actions = 1
                            break;
                        case "two":
                            actionType = "action"
                            actions = 2
                            break;
                        case "three":
                            actionType = "action"
                            actions = 3
                            break;
                    }
                }
                let category = ""
                if (!!s.type) {
                    switch(s.type) {
                        case "defense":
                            category = "defensive"
                            break;
                        case "offense":
                            category = "offensive"
                            break;
                        case "general":
                            category = "interaction"
                            break;
                    }
                }
    
                let itemTraits = []
                if (!!s && !!s.traits) {
                    const itemTraitsSplit = s.traits.replaceAll(' ','').split(',')
                    itemTraitsSplit.forEach(i => {
                        itemTraits.push(i.toLowerCase())
                    })
                }

                let boldRegex = /\*\*([a-zA-Z0-9\ ]+)\*\*/g;
                let parsedDescription = !!s.description ? s.description : ""
                parsedDescription = parsedDescription
                                    .replaceAll('\n', '<br/>')
                                    .replaceAll('(A)','<span class="action">1</span>')
                                    .replaceAll('(AA)','<span class="action">2</span>')
                                    .replaceAll('(AAA)','<span class="action">3</span>')
                parsedDescription = parsedDescription.replace(boldRegex, '<b>$1</b>')
    
                items.push({
                    "_id": !!s.id ? s.id : this.randomID(16),
                    "name": !!s.name ? s.name : "",
                    "type": "action",
                    "system": {
                        "category": category,
                        "actionType": {
                            "value": actionType
                        },
                        "actions": {
                            "value": actions
                        },
                        "description": {
                            "value": parsedDescription
                        },
                        "foundryDescription": {
                            "value": parsedDescription
                        },
                        "requirements": {
                            "value": ""
                        },
                        "rules": [],
                        "slug": "",
                        "source": {
                            "value": !!s.src ? s.src : "Custom"
                        },
                        "traits": {
                            "custom": "",
                            "rarity": "common",
                            "value": itemTraits
                        },
                        "trigger": {
                            "value": ""
                        },
                        "weapon": {
                            "value": ""
                        }
                    }
                })
            })
        }
    
        // Attacks
        if (!!customJSON && !!customJSON.strikes && customJSON.strikes.length > 0) {
            customJSON.strikes.forEach(s => {
                let itemTraits = []
                if (!!s && !!s.traits) {
                    const itemTraitsSplit = s.traits.replaceAll(' ','').split(',')
                    itemTraitsSplit.forEach(i => {
                        itemTraits.push(i.toLowerCase())
                    })
                }
                let damageRolls = {}
                if (!!s && !!s.damage) {
                    const damageSplit = s.damage.replaceAll(' plus ',',').replaceAll(' and ',',').replaceAll(', ',',').split(',')
                    damageSplit.forEach(i => {
                        let dmgSplit = i.split(' ')
                        if (!!dmgSplit && dmgSplit.length == 2) {
                            damageRolls[this.randomID(20)] = {
                                damage: dmgSplit[0],
                                damageType: dmgSplit[1]
                            }
                        } else if (!!dmgSplit && dmgSplit.length == 1) {
                            damageRolls[this.randomID(20)] = {
                                damage: dmgSplit[0],
                                damageType: 'generic'
                            }
                        }
                    })
                }
    
                items.push({
                    "_id": !!s.id ? s.id : this.randomID(16),
                    "name": !!s.name ? this.capitalize(s.name) : "",
                    "type": "melee",
                    "system": {
                        "attack": {
                            "value": ""
                        },
                        "attackEffects": {
                            "custom": "",
                            "value": []
                        },
                        "bonus": {
                            "value": !!s.attack ? Number(s.attack) : 0
                        },
                        "damageRolls": damageRolls,
                        "description": {
                            "value": ""
                        },
                        "rules": [],
                        "slug": null,
                        "source": {
                            "value": ""
                        },
                        "traits": {
                            "custom": "",
                            "rarity": "common",
                            "value": itemTraits
                        },
                        "weaponType": {
                            "value": !!s.type ? s.type.toLowerCase() : "",
                        }
                    }
                })
            })
        }
    
        // Spell Entry
        const spellType = !!customJSON.spelltype ? customJSON.spelltype : 'Generic'
        if (!!customJSON && !!spellType && !!customJSON.spelldc && !!customJSON.spelldc.value && !!customJSON.spellattack && !!customJSON.spellattack.value) {
            let tradition = spellType.toLowerCase().replace('innate','').replaceAll(' ','')
            let prepared = spellType.toLowerCase().includes('innate') ? "innate" : null

            let spellcastingID = this.randomID(16)

            let spellList = customJSON.spells
            let spellSlots = {
                "slot0": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot1": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot10": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot11": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot2": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot3": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot4": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot5": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot6": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot7": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot8": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                },
                "slot9": {
                    "max": 0,
                    "prepared": [],
                    "value": 0
                }
            }

            let currentSpellLevel = 10

            spellList.forEach(spellLevel => {
                if (spellLevel != "") {
                    let spellsSplit = spellLevel.replaceAll(', ',',').split(',')
                    if (!!spellsSplit && spellsSplit.length > 0) {
                        spellsSplit.forEach(spellName => {
                            let spellFound = this.SpellService.getSpellByName(spellName)

                            if (!!spellFound && !!spellFound._id) {
                                let currentSlots = spellSlots['slot'+currentSpellLevel].max
                                spellSlots['slot'+currentSpellLevel].max = currentSlots+1
                                spellSlots['slot'+currentSpellLevel].prepared = spellSlots['slot'+currentSpellLevel].prepared.concat({
                                    "id": spellFound._id
                                })

                                spellFound.system.location = {value: spellcastingID}

                                items.push(spellFound)
                            }
                        })
                    }
                }
                currentSpellLevel = currentSpellLevel-1
            })


            items.push({
                "_id": spellcastingID,
                "name": this.capitalize(spellType) + " spells",
                "type": "spellcastingEntry",
                "system": {
                    "autoHeightenLevel": {
                        "value": null
                    },
                    "description": {
                        "value": ""
                    },
                    "displayLevels": {},
                    "prepared": {
                        "value": prepared
                    },
                    "proficiency": {
                        "value": 0
                    },
                    "rules": [],
                    "showSlotlessLevels": {
                        "value": false
                    },
                    "showUnpreparedSpells": {
                        "value": true
                    },
                    "slots": spellSlots,
                    "slug": null,
                    "source": {
                        "value": ""
                    },
                    "spelldc": {
                        "dc": Number(customJSON.spelldc.value),
                        "mod": 0,
                        "value": Number(customJSON.spellattack.value)
                    },
                    "tradition": {
                        "value": tradition
                    },
                    "traits": {
                        "custom": "",
                        "rarity": "common",
                        "value": []
                    }
                }
            })
        }
    
        // Skills
        const allSkill = [
            "acrobatics","arcana","athletics","crafting","deception","diplomacy","intimidation","medicine",
            "nature","occultism","performance","religion","society","stealth","survival","thievery"
        ]
        allSkill.forEach(s => {
            if (!!customJSON && !!customJSON[s] && !!customJSON[s].value) {
                const curSkill = customJSON[s]
    
                items.push({
                    "_id": this.randomID(16),
                    "name": this.capitalize(s),
                    "type": "lore",
                    "system": {
                        "description": {
                            "value": ""
                        },
                        "mod": {
                            "value": !!curSkill.value ? Number(curSkill.value) : 0
                        },
                        "proficient": {
                            "value": 0
                        },
                        "rules": [],
                        "slug": null,
                        "source": {
                            "value": ""
                        },
                        "traits": {
                            "custom": "",
                            "rarity": "common",
                            "value": []
                        }
                    }
                })
            }
        })

        let creatureID = 'c-'+customJSON.name.replaceAll(' ','').toLowerCase()

        const foundryJSON = {
            "_id": creatureID,
            "system": {
                "abilities": {
                    "cha": {
                        "mod": !!customJSON.charisma && !!customJSON.charisma.value ? Number(customJSON.charisma.value) : 0
                    },
                    "con": {
                        "mod": !!customJSON.constitution && !!customJSON.constitution.value ? Number(customJSON.constitution.value) : 0
                    },
                    "dex": {
                        "mod": !!customJSON.dexterity && !!customJSON.dexterity.value ? Number(customJSON.dexterity.value) : 0
                    },
                    "int": {
                        "mod": !!customJSON.intelligence && !!customJSON.intelligence.value ? Number(customJSON.intelligence.value) : 0
                    },
                    "str": {
                        "mod": !!customJSON.strength && !!customJSON.strength.value ? Number(customJSON.strength.value) : 0
                    },
                    "wis": {
                        "mod": !!customJSON.wisdom && !!customJSON.wisdom.value ? Number(customJSON.wisdom.value) : 0
                    }
                },
                "attributes": {
                    "ac": {
                        "details": !!customJSON.ac && !!customJSON.ac.note ? customJSON.ac.note : "",
                        "value": !!customJSON.ac && !!customJSON.ac.value ? Number(customJSON.ac.value) : 10
                    },
                    "allSaves": {
                        "value": !!customJSON.savenote ? customJSON.savenote : "",
                    },
                    "hp": {
                        "details": !!customJSON.hp && !!customJSON.hp.note ? customJSON.hp.note : "",
                        "max": !!customJSON.hp && !!customJSON.hp.value ? Number(customJSON.hp.value) : 10,
                        "temp": 0,
                        "value": !!customJSON.hp && !!customJSON.hp.value ? Number(customJSON.hp.value) : 10
                    },
                    "immunities": immunity,
                    "resistances": resistance,
                    "weaknesses": weakness,
                    "initiative": {
                        "ability": "perception"
                    },
                    "perception": {
                        "value": !!customJSON.perception && !!customJSON.perception.value ? Number(customJSON.perception.value) : 10
                    },
                    "speed": {
                        "otherSpeeds": otherSpeeds,
                        "value": movespeed,
                    }
                },
                "details": {
                    "alignment": {
                        "value": !!customJSON.alignment ? customJSON.alignment.toUpperCase() : "",
                    },
                    "blurb": "",
                    "level": {
                        "value": !!customJSON.level || customJSON.level == 0 ? Number(customJSON.level) : -1
                    },
                    "privateNotes": "",
                    "publicNotes": "<p>Custom creature.</p>",
                    "source": {
                        "value": "Custom"
                    }
                },
                "resources": {
                    "focus": {
                        "max": !!customJSON.focuspoints ? customJSON.focuspoints : 0,
                        "value": !!customJSON.focuspoints ? Number(customJSON.focuspoints) : 0
                    }
                },
                "saves": {
                    "fortitude": {
                        "saveDetail": !!customJSON.fortitude && !!customJSON.fortitude.note ? customJSON.fortitude.note : "",
                        "value": !!customJSON.fortitude && !!customJSON.fortitude.value ? Number(customJSON.fortitude.value) : 0,
                    },
                    "reflex": {
                        "saveDetail": !!customJSON.reflex && !!customJSON.reflex.note ? customJSON.reflex.note : "",
                        "value": !!customJSON.reflex && !!customJSON.reflex.value ? Number(customJSON.reflex.value) : 0,
                    },
                    "will": {
                        "saveDetail": !!customJSON.will && !!customJSON.will.note ? customJSON.will.note : "",
                        "value": !!customJSON.will && !!customJSON.will.value ? Number(customJSON.will.value) : 0,
                    }
                },
                "traits": {
                    "languages": {
                        "custom": "",
                        "selected": [],
                        "value": languages
                    },
                    "rarity": "common",
                    "senses": {
                        "value": !!customJSON.perception && !!customJSON.perception.note ? customJSON.perception.note : "",
                    },
                    "size": {
                        "value": !!customJSON.size ? this.sizeConvert(customJSON.size.toLowerCase()) : 'med'
                    },
                    "value": customBeastTraits
                }
            },
            "items": items,
            "name": customJSON.name,
            "type": "npc",
        }
    
        return foundryJSON
    }
    
    randomID(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    
    sizeConvert(size) {
        switch(size) {
            case 'tiny':
                return 'tiny'
            case 'small':
                return 'sm'
            case 'medium':
                return 'med'
            case 'large':
                return 'lg'
            case 'huge':
                return 'huge'
            case 'gargantuan':
                return 'grg'
        }
    }
    
    parseSimpleArray(array) {
        let returnArray = []
        if (!!array) {
            const arraySplit = array.replaceAll(' ','').split(',')
            arraySplit.forEach(i => {
                returnArray.push(i.toLowerCase())
            })
        }
        return returnArray
    }
    
}

export default new BestiaryService();