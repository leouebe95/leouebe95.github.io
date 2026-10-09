import { describe, it, assert } from '../test-runner.js';
import { Hand } from '../../src/core/models/Hand.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';
import { MeldType } from '../../src/core/models/Meld.js';
import { TilePalette } from '../../src/ui/components/TilePalette.js';
import { HandDisplay } from '../../src/ui/components/HandDisplay.js';
import { FlowersBar } from '../../src/ui/components/FlowersBar.js';
import { SpecialConditions } from '../../src/ui/components/SpecialConditions.js';
import { eventBus, Events } from '../../src/utils/EventBus.js';

function createEntry() {
    const displayRoot = document.createElement('section');
    const pickerRoot = document.createElement('div');
    document.body.append(displayRoot, pickerRoot);
    const hand = new Hand();
    const display = new HandDisplay(displayRoot);
    const picker = new TilePalette(pickerRoot);
    display.setHand(hand);
    picker.setHand(hand);
    return { hand, displayRoot, pickerRoot, display, picker };
}

function chooseSuit(root, suit) {
    root.querySelector(`[data-suit="${suit}"]`).click();
}

function chooseTile(root, index = 0) {
    root.querySelectorAll('#palette-tiles-grid .mj-tile')[index].click();
}

function selectMeldType(root, meldIndex, type) {
    const selector = root.querySelectorAll('.meld-type-select')[meldIndex];
    selector.value = type;
    selector.dispatchEvent(new Event('change'));
}

describe('Integration: Manual Tile Entry', () => {
    it('opens a tile popup after selecting a meld type and fills the meld automatically', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.CHOW);
            assert.ok(pickerRoot.classList.contains('open'), 'The tile picker opens');
            assert.equal(pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile').length, 9);

            chooseTile(pickerRoot, 1);
            assert.equal(hand.melds[0].type, MeldType.CHOW);
            assert.equal(hand.melds[0].firstTile.num, 2);
            assert.deepEqual(hand.melds[0].getTiles().map(tile => tile.num), [2, 3, 4]);
            assert.isFalse(pickerRoot.classList.contains('open'), 'The picker closes after selection');
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('automatically fills all four tiles when a kong starting tile is chosen', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.KONG);
            chooseTile(pickerRoot, 3);

            assert.equal(hand.melds[0].type, MeldType.KONG);
            assert.equal(hand.melds[0].getTiles().length, 4);
            assert.ok(hand.melds[0].getTiles().every(tile => tile.num === 4));
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('fills the pair from the selected first tile', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            const pairSelector = displayRoot.querySelector('.pair-type-select');
            const pairChip = displayRoot.querySelector('.meld-type-chip');
            assert.isFalse(Boolean(pairSelector), 'Pair is not rendered as a dropdown');
            assert.equal(pairChip.textContent, 'Pair');
            assert.equal(pairChip.className, 'meld-type-chip');
            assert.equal(pairChip.getBoundingClientRect().height, 26);
            displayRoot.querySelector('[data-meld-index="4"] .mj-tile').click();
            assert.ok(pickerRoot.classList.contains('open'));
            chooseSuit(pickerRoot, 'honor');
            chooseTile(pickerRoot, 5);

            assert.equal(hand.melds[4].type, MeldType.PAIR);
            assert.equal(hand.melds[4].getTiles().length, 2);
            assert.ok(hand.melds[4].getTiles().every(tile => tile.type === TileType.DRAGON && tile.num === 2));
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('toggles concealed state with the square control and applies it to the new meld', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            const toggle = displayRoot.querySelector('.concealed-toggle-btn');
            assert.equal(toggle.getAttribute('aria-pressed'), 'true');
            const typeSelector = displayRoot.querySelector('.meld-type-select');
            assert.equal(toggle.getBoundingClientRect().height, typeSelector.getBoundingClientRect().height);
            assert.equal(typeSelector.getBoundingClientRect().height, 26);
            assert.equal(
                displayRoot.querySelector('.meld-group').children[0].className,
                'meld-tiles',
                'Meld tiles appear above the controls'
            );
            assert.isFalse(typeSelector.options[0].textContent.includes('('), 'Meld options use compact labels');
            toggle.click();
            assert.equal(displayRoot.querySelector('.concealed-toggle-btn').getAttribute('aria-pressed'), 'false');

            selectMeldType(displayRoot, 0, MeldType.PUNG);
            chooseTile(pickerRoot);
            assert.isFalse(hand.melds[0].isConcealed);
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('prevents selecting an invalid chow start tile', () => {
        const { displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.CHOW);
            assert.equal(
                pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile:disabled').length,
                2,
                'Ranks eight and nine cannot start a chow'
            );
            chooseSuit(pickerRoot, 'honor');
            assert.equal(
                pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile:disabled').length,
                7
            );
            assert.ok(pickerRoot.classList.contains('open'));
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('allows replacing a meld through its tile slot', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.PUNG);
            chooseTile(pickerRoot);
            displayRoot.querySelector('[data-meld-index="0"] .mj-tile').click();
            chooseSuit(pickerRoot, 'bamboo');
            chooseTile(pickerRoot, 1);

            assert.equal(hand.melds[0].type, MeldType.PUNG);
            assert.equal(hand.melds[0].firstTile.type, TileType.BAMBOO);
            assert.equal(hand.melds[0].firstTile.num, 2);
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('rejects a meld placement that exceeds the four-copy tile limit with visible feedback', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.PUNG);
            chooseSuit(pickerRoot, 'bamboo');
            chooseTile(pickerRoot);

            selectMeldType(displayRoot, 1, MeldType.PUNG);
            chooseTile(pickerRoot);

            assert.ok(hand.melds[0].isValid(), 'First pung was entered');
            assert.equal(hand.melds[1].isValid(), false, 'Second pung was rejected');
            assert.ok(pickerRoot.querySelector('#palette-error').textContent.length > 0, 'Rejection is visible');
            assert.ok(pickerRoot.classList.contains('open'), 'Picker remains open for correction');
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('selects tiles interactively in a special hand', () => {
        const { hand, displayRoot, pickerRoot } = createEntry();
        try {
            displayRoot.querySelector('#btn-special-hand').click();
            displayRoot.querySelector('[data-tile-index="0"]').click();
            chooseSuit(pickerRoot, 'dot');
            chooseTile(pickerRoot, 2);

            assert.ok(hand.tiles[0].isValid());
            assert.equal(hand.tiles[0].type, TileType.DOT);
            assert.equal(hand.tiles[0].num, 3);
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('preserves flower toggling on the dedicated flower row', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            const hand = new Hand();
            const tile = new Tile(TileType.FLOWER, 1);
            const flowers = new FlowersBar(root);
            flowers.setHand(hand);
            assert.isFalse(Boolean(root.querySelector('#flowers-label')), 'Flower tiles render without a heading');
            assert.equal(root.querySelectorAll('.flower-slot').length, 8);
            root.querySelector('.flower-slot').click();
            assert.ok(hand.hasFlower(tile));
            root.querySelector('.flower-slot').click();
            assert.isFalse(hand.hasFlower(tile));
        } finally {
            root.remove();
        }
    });

    it('sizes condition toggles to match the wind selectors', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            new SpecialConditions(root);
            const windHeight = root.querySelector('#table-wind-select').getBoundingClientRect().height;
            root.querySelectorAll('.conditions-bar > .condition-pill').forEach(pill => {
                assert.equal(pill.getBoundingClientRect().height, windHeight);
            });
        } finally {
            root.remove();
        }
    });

    it('highlights and clears tiles attributed to a scoring combination', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            const display = new HandDisplay(root);
            display.setHand(new Hand());
            eventBus.emit(Events.HIGHLIGHT_TILES, { meldIndices: [0], tileIndices: [] });
            assert.equal(root.querySelectorAll('.combination-highlight').length, 3);

            eventBus.emit(Events.CLEAR_HIGHLIGHT);
            assert.equal(root.querySelectorAll('.combination-highlight').length, 0);
        } finally {
            root.remove();
        }
    });
});
