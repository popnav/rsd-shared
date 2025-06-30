import { SANCTIFICATION_TRAITS, ALIGNMENT_TRAITS } from '../constants/gametypes'

//we sort to make sure things are in the order we expect
//(like LAWFUL EVIL rather than what some foundry data
//has like EVIL LAWFUL).  And the similar concepts of holy/
//unholy are sorted first here also.
function traitSortValue(trait) {
    switch (trait) {
        case 'holy':
            return 1000;
        case 'unholy':
            return 1001;
        case 'lawful':
            return 2001;
        case 'chaotic':
            return 2001;
        case 'neutral':
            return 2002;
        case 'good':
            return 2003;
        case 'evil':
            return 2003;
        default:
            return 50000;
    }
}


//we still have legacy bestiary source that has alignment data that
//we would like to continue to present.  Also, foundry vtt pf2e likes
//does have some legacy alignment info and likes (at least through
//commit 44d6a2) to keep that in the actual trait array values.
//So, when we find (e.g.) custom alignment data- we add it to trait
//array as well.
//In addition, there is some similarity between alignment and the
//concept of holy/unholy.
//This mixin helps us present these features together and provides a
//mechanism to display remaining traits without including any of
//these alignment-like traits
export default {
    methods: {
        alignmentLikeTraits(traits) {
            let alignmentTraits = traits.filter(t => ALIGNMENT_TRAITS.includes(t) || SANCTIFICATION_TRAITS.includes(t))
            return alignmentTraits.sort((a, b) => traitSortValue(a) - traitSortValue(b))
        },
        otherTraits(traits) {
            return traits.filter(t => !(ALIGNMENT_TRAITS.includes(t) || SANCTIFICATION_TRAITS.includes(t)))
        },
    }
}
