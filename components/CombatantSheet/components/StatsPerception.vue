<template>
    <span v-if="!!perception">
        <span class="font-weight-bold mr-1">Perception</span>
        <v-tooltip
            top
            content-class="no-transparancy"
        >
            <template v-slot:activator="{ on, attrs }">
                <span
                    v-bind="attrs"
                    v-on="on"
                    :class="!!perception.modified ? 'red--text font-weight-medium' : ''"
                    @click="roll(perception.mod)"
                    class="pointer"
                >
                    <span v-if="perception.mod >= 0">+</span>
                    <span class="mr-1">{{perception.mod}};</span>
                </span>
            </template>
            <span v-if="!!results[`${cidentifier}-perception`]">
                    <span class="mr-1">Perception:</span>
                    <span class="mr-1">{{results[`${cidentifier}-perception`].total}}</span>
                    <span>[{{results[`${cidentifier}-perception`].roll}}, {{skillValue(perception.mod)}}]</span>
                </span>
            <span v-else>Click to roll a Perception check</span>
        </v-tooltip>
        <span 
            v-for="(sense, index) in senses"
            :key="'sense-'+sense.name"
        >
            <v-menu
                v-if="!!sense.description && !!sense.title"
                :close-on-content-click="false"
                offset-x
                :nudge-left="250"
            >
                <template v-slot:activator="{ on, attrs }">
                    <span
                        v-bind="attrs"
                        v-on="on"
                        class="text-decoration-underline"
                    >{{sense.name}}</span>
                </template>
                <v-card
                    elevation="5"
                    width="500"
                >
                    <v-card-title>{{sense.title}}</v-card-title>
                    <v-card-text v-html="$sanitize(sense.description)"></v-card-text>
                </v-card>
            </v-menu>
            <span v-else>{{sense.name}}</span>
            <span v-if="index != senses.length - 1">, </span>
        </span>
    </span>
</template>

<script>
export default {
    props: {
        perception: Object,
        senses: Array,
        cidentifier: String,
    },
    data() {
        return {
            results: {
                perception: null,
            }
        }
    },
    methods: {
        roll(value) {
            const diceroll = Math.floor(Math.random() * 20 + 1)
            this.$set(this.results, `${this.cidentifier}-perception`, {
                total: diceroll + value,
                roll: diceroll,
            })

            let eventhistory = {
                identifier: this.cidentifier,
                event: {
                    short: `Perception: ${diceroll + value} [${diceroll},${this.skillValue(value)}]`,
                }
            }

            if (diceroll == 1) {
                eventhistory.event.critfail = true
            } else if (diceroll == 20) {
                eventhistory.event.critsuccess = true
            }
            
            this.$rsd.eventhistory.push(eventhistory)
        },
        skillValue(value) {
            return value >= 0 ? `+${value}` : value
        }
    },
}
</script>