const EventEmitter = require('events')

import { set, get } from 'idb-keyval';

//todo - see old code - should 'custom' be in both shared/APIService and BestiaryService?
const bestiaryURLEndings = [
    'bestiary1',
    'bestiary2',
    'bestiary3',
    'abomination_vaults_bestiary',
    'age_of_ashes_bestiary',
    'agents_of_edgewatch_bestiary',
    'battlecry_bestiary',
    'blog_bestiary',
    'blood_lords_bestiary',
    'book_of_the_dead_bestiary',
    'claws_of_the_tyrant_bestiary',
    'crown_of_the_kobold_king_bestiary',
    'curtain_call_bestiary',
    'extinction_curse_bestiary',
    'fall_of_plaguestone',
    'fists_of_the_ruby_phoenix_bestiary',
    'gatewalkers_bestiary',
    'hazards_bestiary',
    'howl_of_the_wild_bestiary',
    'iconics',
    'kingmaker_bestiary',
    'lost_omens_bestiary',
    'malevolence_bestiary',
    'menace_under_otari_bestiary',
    'myth_speaker_bestiary',
    'night_of_the_gray_death_bestiary',
    'npc_gallery',
    'one_shot_bestiary',
    'outlaws_of_alkenstar_bestiary',
    'pathfinder_dark_archive',
    'pathfinder_monster_core',
    'pathfinder_monster_core_2',
    'pathfinder_npc_core',
    'pfs_introductions_bestiary',
    'pfs_season_1_bestiary',
    'pfs_season_2_bestiary',
    'pfs_season_3_bestiary',
    'pfs_season_4_bestiary',
    'pfs_season_5_bestiary',
    'pfs_season_6_bestiary',
    'pfs_season_7_bestiary',
    'prey_for_death_bestiary',
    'quest_for_the_frozen_flame_bestiary',
    'rage_of_elements_bestiary',
    'revenge_of_the_runelords_bestiary',
    'rusthenge_bestiary',
    'season_of_ghosts_bestiary',
    'seven_dooms_for_sandpoint_bestiary',
    'shades_of_blood_bestiary',
    'shadows_at_sundown_bestiary',
    'spore_war_bestiary',
    'stolen_fate_bestiary',
    'strength_of_thousands_bestiary',
    'the_enmity_cycle_bestiary',
    'the_slithering_bestiary',
    'triumph_of_the_tusk_bestiary',
    'troubles_in_otari_bestiary',
    'war_of_immortals_bestiary',
    'wardens_of_wildwood_bestiary',
]
// const bestiaryCount = 10

const staticURLEndings = [
    'en.json',
    're-en.json'
]

class APIService extends EventEmitter {
    constructor() {
        super()
    }

    init(axios, store, dev = false) {
        // console.log("Init APIService")
        this._bestiary = []

        this.$store = store
        this.axios = axios

        // let devenv = ''
        let devenv = false
        this.authCookie = "f356ec2e-9827-4e8f-8f67-4b744080ebbb"
        if (dev) {
            devenv = true
            // devenv = '-dev'
            // this.authCookie = "0769059e-c97a-4d55-8cb9-3ba579d82861"
        }

        let baseurl = !!devenv ? `http://localhost:3000` : `https://api.readysetdice.com`

        this.actionUrl = `${baseurl}/actions/`
        this.ancestryUrl = `${baseurl}/ancestries/`
        this.ancestryFeatureUrl = `${baseurl}/ancestryfeatures/`
        // this.archetypeUrl = `${baseurl}/archetypes/`
        this.backgroundUrl = `${baseurl}/backgrounds/`
        this.bestiaryUrl = `${baseurl}/bestiary/`
        this.classUrl = `${baseurl}/classes/`
        this.deityUrl = `${baseurl}/deities/`
        this.domainUrl = `${baseurl}/domains/`
        // this.classExtendedUrl = `${baseurl}/classes-extended/`
        this.classFeatureUrl = `${baseurl}/classfeatures/`
        this.conditionUrl = `${baseurl}/condition/`
        this.featUrl = `${baseurl}/feats/`
        this.heritageUrl = `${baseurl}/heritages/`
        this.spellUrl = `${baseurl}/spells/`
        this.spellEffectsUrl = `${baseurl}/spell-effects/`
        this.staticUrl = `${baseurl}/static/`

        this.headers = {
            headers: {
                "Authorization": this.authCookie
            }
        }

        // console.log('this.authCookie', this.authCookie)

        // console.log("APIService Init")
        // Conditions get
        const localConditions = this.$store.getters['pf2e/conditionInfo']
        this.axios.get(this.conditionUrl + 'version', this.headers)
        .then(async (response) => {
            if (response.data && response.data.version) {
                const remoteConditionsVersion = response.data.version
                const remoteConditionsCount = response.data.count

                if (!localConditions || !localConditions.items || (localConditions.items && remoteConditionsVersion > localConditions.version || localConditions.items.length != remoteConditionsCount)) {
                    this.getRemoteConditions(remoteConditionsVersion)
                }
            }
        })


        // Bestiary get
        let bCount = 0
        const localBestiary = this.$store.getters['pf2e/bestiary']

        console.log("Local Bestiary count: ", localBestiary)
        this.axios.get(this.bestiaryUrl + 'version', this.headers)
        .then(async (response) => {
            if (response.data && response.data.version) {
                const remoteBestiaryVersion = response.data.version
                const remoteBestiaryCount = response.data.count

                if (!localBestiary || (remoteBestiaryVersion > localBestiary.version || localBestiary.count != remoteBestiaryCount)) {
                    // this.$store.dispatch('pf2e/clearBestiary', {version: remoteBestiaryCount})
                    
                    bestiaryURLEndings.forEach(burl => {
                        // console.log('calling ', burl)
                        this.axios.get(this.bestiaryUrl + burl, this.headers)
                        .then(async (response) => {
                            set(burl, response.data.results)
                            bCount += response.data.count
                            console.log(`Loading Remote Bestiary '${burl}' with ${response.data.count} entries, counting ${bCount}/${remoteBestiaryCount}`)

                            if (bCount == remoteBestiaryCount) {
                                this.$store.dispatch('pf2e/setBestiaryInfo', {count: remoteBestiaryCount, version: remoteBestiaryVersion})
                                this.emit('BestiarySet')
                            }
                            // this._bestiary = this._bestiary.concat(response.data.results)
                            // console.log("Bestiary init", bestiaryCount)
                            // bestiaryCount+=1
                            // if (bestiaryCount == bestiaryURLEndings.length) {
                            //     this.emit('Bestiary', this._bestiary)
                            // }
                            // this.emit('Bestiary', this._bestiary)
                        })
                        .catch((error) => {
                            console.log(error)
                        })
                    })
                } else {
                    this.emit('BestiarySet')
                }
            }
        })

        // Actions get
        const localAction = this.$store.getters['pf2e/action']
        this.getSingle(localAction, this.actionUrl, 'actions', 'ActionSet', 'pf2e/setActionInfo')

        // Ancestries get
        const localAncestry = this.$store.getters['pf2e/ancestry']
        this.getSingle(localAncestry, this.ancestryUrl, 'ancestries', 'AncestrySet', 'pf2e/setAncestryInfo')

        // Ancestry Features get
        const localAncestryFeatures = this.$store.getters['pf2e/ancestryFeature']
        this.getSingle(localAncestryFeatures, this.ancestryFeatureUrl, 'ancestryFeatures', 'AncestryFeatureSet', 'pf2e/setAncestryFeatureInfo')

        // Archetypes get
        // const localArchetype = this.$store.getters['pf2e/archetype']
        // this.getSingle(localArchetype, this.archetypeUrl, 'archetypes', 'ArchetypeSet', 'pf2e/setArchetypeInfo')

        // Backgrounds get
        const localBackground = this.$store.getters['pf2e/background']
        this.getSingle(localBackground, this.backgroundUrl, 'backgrounds', 'BackgroundSet', 'pf2e/setBackgroundInfo')

        // Classes get
        const localClass = this.$store.getters['pf2e/class']
        this.getSingle(localClass, this.classUrl, 'classes', 'ClassSet', 'pf2e/setClassInfo')

        // Classes Extended get
        // const localClassExtened = this.$store.getters['pf2e/classExtended
        // this.getSingle(localClassExtened, this.classExtendedUrl, 'classesExtened', 'ClassExtenedSet', 'pf2e/setClassExtendedInfo')

        // Classes Features get
        const localClassFeature = this.$store.getters['pf2e/classFeature']
        this.getSingle(localClassFeature, this.classFeatureUrl, 'classFeatures', 'ClassFeatureSet', 'pf2e/setClassFeatureInfo')

        // Deities get
        const localDeity = this.$store.getters['pf2e/deity']
        this.getSingle(localDeity, this.deityUrl, 'deities', 'DeitySet', 'pf2e/setDeityInfo')

        // Deities get
        const localDomain = this.$store.getters['pf2e/domain']
        this.getSingle(localDomain, this.domainUrl, 'domains', 'DomainSet', 'pf2e/setDomainInfo')

        // Feats get
        const localFeat = this.$store.getters['pf2e/feat']
        this.getSingle(localFeat, this.featUrl, 'feats', 'FeatSet', 'pf2e/setFeatInfo')

        // Deities get
        const localHeritage = this.$store.getters['pf2e/heritage']
        this.getSingle(localHeritage, this.heritageUrl, 'heritages', 'HeritageSet', 'pf2e/setHeritageInfo')

        // Spells get
        const localSpell = this.$store.getters['pf2e/spell']
        this.getSingle(localSpell, this.spellUrl, 'spells', 'SpellSet', 'pf2e/setSpellInfo')

        // Spell Effects get
        const localSpellEffects = this.$store.getters['pf2e/spellEffect']
        this.getSingle(localSpellEffects, this.spellEffectsUrl, 'spell_effects', 'SpellEffectSet', 'pf2e/setSpellEffectInfo')


        const localStatic = this.$store.getters['pf2e/static']
        let sCount = 0

        this.axios.get(this.staticUrl + 'version', this.headers)
        .then(async (response) => {
            // console.log(response)
            if (response.data && response.data.version) {
                const remoteStaticVersion = response.data.version

                if (!localStatic || remoteStaticVersion > localStatic.version) {
                    // this.$store.dispatch('clearBestiary', {version: remoteBestiaryCount})
                    
                    staticURLEndings.forEach(surl => {
                        this.axios.get(this.staticUrl + surl, this.headers)
                        .then(async (response) => {
                            // console.log('sub', response)
                            set(surl, response.data)
                            sCount += 1

                            if (sCount == 2) {
                                this.$store.dispatch('pf2e/setStatic', {version: remoteStaticVersion})
                                this.emit('StaticSet')
                            }
                        })
                        .catch((error) => {
                            console.log(error)
                        })
                    })
                } else {
                    this.emit('StaticSet')
                }
            }
        })

    }

    getSingle(localData, url, db, event, storeEvent) {
        this.axios.get(url + 'version', this.headers)
        .then(async (response) => {
            if (response.data && response.data.version) {
                const remoteVersion = response.data.version
                const remoteCount = response.data.count

                if (!localData || (remoteVersion > localData.version || localData.count != remoteCount)) {

                    var versionData = {
                        count: remoteCount,
                        version: remoteVersion
                    }

                    this.getRemoteSingle(url, db, event, storeEvent, versionData)
                } else {
                    get(db).then(async (response) => {
                        if (!response) {
                            var versionData = {
                                count: remoteCount,
                                version: remoteVersion
                            }
        
                            this.getRemoteSingle(url, db, event, storeEvent, versionData)
                        } else {
                            this.emit(event)
                        }
                    })
                }
            }
        })
    }
    
    getRemoteSingle(url, db, event, storeEvent, versionData) {
        this.axios.get(url, this.headers)
        .then(async (response) => {
            if (versionData.count == response.data.results.length) {

                set(db, response.data.results)

                this.$store.dispatch(storeEvent, versionData)
                this.emit(event)
            }
        })
        .catch((error) => {
            console.log(error)
        })
    }

    getRemoteConditions(version) {
        this.axios.get(this.conditionUrl, this.headers)
        .then(async (response) => {
            // this._conditions = response.data.results
            // this.emit('Conditions', this._conditions)
            this.$store.dispatch('pf2e/setCondition', {items: response.data.results, version: version})
        })
        .catch((error) => {
            console.log(error)
        })
    }

    getBestiary() {
        return this._bestiary
    }

    getBestiaryByName(name) {
        return this.getBestiary().find((e,i) => {
            if (e.name == name) {
                return e
            }
        })
    }

    getBestiaryByID(id) {
        return this.getBestiary().find((e,i) => {
            if (e._id == id) {
                return e
            }
        })
    }
}

export default new APIService();