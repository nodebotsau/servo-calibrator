// This is a theme file essentially to just define the main colours etc
// being used. Change if you don't like it.

// colours used dark solarized theme
var colours = {
    base03: '#002b36',
    base02: '#073642',
    base01: '#586e75',
    base00: '#657b83',
    base0 : '#839496',
    base1 : '#93a1a1',
    base2 : '#eee8d5',
    base3 : '#fdf6e3',
    yellow: '#af8700',
    orange: '#d75f00',
    red:    '#d70000',
    magenta:'#af005f',
    violet: '#5f5faf',
    blue:   '#0087ff',
    cyan:   '#00afaf',
    green:  '#5f8700',
};


var styles = {
    default_styles: {
        bg: colours.base03,
        fg: colours.base2,
    },

    default_borders: {
        type: 'line',
        bg: colours.base02,
        fg: colours.base1,
    },

    error_styles: {
        bg: colours.base2,
        fg: colours.base03,
    },

    error_borders: {
        type: 'line',
        bg: colours.base2,
        fg: colours.red,
    },

    popup_styles: {
        bg: colours.base2,
        fg: colours.base03,
    },

    popup_borders: {
        type: 'line',
        bg: colours.base2,
        fg: colours.base03,
    },

    form_styles: {
        bg: colours.base03,
        fg: colours.base2,
        focus: {
            bg: colours.red,
            fg: colours.base2,
        },
    },
};

module.exports.colours = colours;
module.exports.styles = styles;
