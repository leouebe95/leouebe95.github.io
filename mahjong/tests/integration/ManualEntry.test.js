import { describe, it, assert } from '../test-runner.js';
import { Hand } from '../../src/core/models/Hand.js';
import { Tile, TileType } from '../../src/core/models/Tile.js';
import { MeldType } from '../../src/core/models/Meld.js';
import { TilePalette } from '../../src/ui/components/TilePalette.js';
import { HandDisplay } from '../../src/ui/components/HandDisplay.js';
import { FlowersBar } from '../../src/ui/components/FlowersBar.js';
import { SpecialConditions } from '../../src/ui/components/SpecialConditions.js';
import { TwoStatePushButton } from '../../src/ui/components/TwoStatePushButton.js';
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
            const group = displayRoot.querySelector('[data-meld-index="0"]');
            const tiles = group.querySelector('.meld-tiles').getBoundingClientRect();
            const controls = group.querySelector('.meld-controls').getBoundingClientRect();
            assert.equal(
                Math.round((controls.left + controls.right) / 2),
                Math.round((tiles.left + tiles.right) / 2),
                'Meld controls are centered below their tiles'
            );
            assert.equal(pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile').length, 34);

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

    it('shows every selectable tile together and supports arrow-key navigation', async () => {
        const { displayRoot, pickerRoot } = createEntry();
        try {
            displayRoot.querySelector('#btn-special-hand').click();
            displayRoot.querySelector('[data-tile-index="0"]').click();
            await new Promise(resolve => requestAnimationFrame(resolve));
            const tiles = [...pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile')];
            assert.equal(tiles.length, 34);
            assert.equal(pickerRoot.querySelectorAll('.palette-tab-btn').length, 0);
            assert.deepEqual(
                [...pickerRoot.querySelectorAll('.palette-suit-row')].map(row => row.children.length),
                [9, 9, 9, 4, 3],
                'Each suit and honor group has its own row'
            );
            assert.isFalse(Boolean(pickerRoot.querySelector('#tile-picker-title')), 'The obvious visible title is omitted');
            assert.ok(pickerRoot.querySelector('[role="dialog"]').getAttribute('aria-label'), 'The picker remains accessibly named');

            tiles[0].focus();
            pickerRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            assert.equal(document.activeElement, tiles[1], 'Right arrow focuses the next tile');

            pickerRoot.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
            assert.equal(document.activeElement, tiles[10], 'Down arrow moves to the same column in the next suit row');
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('places the picker below its interaction point and clamps it to the viewport', async () => {
        const { pickerRoot, picker } = createEntry();
        try {
            picker.open({ x: 100, y: 120 });
            await new Promise(resolve => requestAnimationFrame(resolve));
            const content = pickerRoot.querySelector('.tile-picker-content');
            const bounds = content.getBoundingClientRect();
            assert.equal(bounds.top, 128, 'Picker opens below the pointer');
            assert.ok(bounds.left >= 8, 'Picker remains inside the left viewport edge');
            assert.ok(bounds.right <= window.innerWidth - 8, 'Picker remains inside the right viewport edge');
        } finally {
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
            chooseTile(pickerRoot, 32);

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
            assert.ok(toggle.querySelector('img').getAttribute('src').endsWith('concealed.svg'));
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
            const exposedToggle = displayRoot.querySelector('.concealed-toggle-btn');
            assert.equal(exposedToggle.getAttribute('aria-pressed'), 'false');
            assert.ok(exposedToggle.querySelector('img').getAttribute('src').endsWith('exposed.svg'));

            selectMeldType(displayRoot, 0, MeldType.PUNG);
            chooseTile(pickerRoot);
            assert.isFalse(hand.melds[0].isConcealed);
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('resets meld controls to exposed Chows when the hand is cleared', () => {
        const { display, hand, displayRoot, pickerRoot } = createEntry();
        try {
            displayRoot.querySelector('.concealed-toggle-btn').click();
            selectMeldType(displayRoot, 0, MeldType.PUNG);

            display.resetMeldControls();
            display.setHand(hand);

            assert.deepEqual(
                [...displayRoot.querySelectorAll('.meld-type-select')].map(select => Number(select.value)),
                [MeldType.CHOW, MeldType.CHOW, MeldType.CHOW, MeldType.CHOW],
                'Every meld selector resets to Chow'
            );
            assert.deepEqual(
                [...displayRoot.querySelectorAll('.concealed-toggle-btn')].map(button => button.getAttribute('aria-pressed')),
                ['false', 'false', 'false', 'false'],
                'Every meld resets to visible/exposed'
            );

            selectMeldType(displayRoot, 0, MeldType.CHOW);
            chooseTile(pickerRoot);
            assert.isFalse(hand.melds[0].isConcealed, 'A new meld uses the exposed default');
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('uses the compact hand labels and explicit winning-tile selector', () => {
        const { displayRoot } = createEntry();
        try {
            assert.equal(displayRoot.querySelector('#btn-normal-hand').textContent, 'Regular Hand');
            assert.equal(displayRoot.querySelector('#btn-special-hand').textContent, 'Special Hand');
            const button = displayRoot.querySelector('.winning-tile-mode-btn');
            assert.equal(button.textContent, 'Set winning tile');
            assert.equal(button.getAttribute('aria-pressed'), 'false');
            button.click();
            assert.equal(displayRoot.querySelector('.winning-tile-mode-btn').getAttribute('aria-pressed'), 'true');
            assert.equal(displayRoot.querySelector('.winning-tile-hint').textContent,
                'Select this, then click the winning tile in your hand.');
        } finally {
            displayRoot.remove();
        }
    });

    it('prevents selecting an invalid chow start tile', () => {
        const { displayRoot, pickerRoot } = createEntry();
        try {
            selectMeldType(displayRoot, 0, MeldType.CHOW);
            assert.equal(
                pickerRoot.querySelectorAll('#palette-tiles-grid .mj-tile:disabled').length,
                13,
                'Honors and ranks eight and nine cannot start a chow'
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
            chooseTile(pickerRoot, 10);

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
            chooseTile(pickerRoot, 9);

            selectMeldType(displayRoot, 1, MeldType.PUNG);
            chooseTile(pickerRoot, 9);

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
            chooseTile(pickerRoot, 20);

            assert.ok(hand.tiles[0].isValid());
            assert.equal(hand.tiles[0].type, TileType.DOT);
            assert.equal(hand.tiles[0].num, 3);
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('sets the winning tile with the explicit selector in a 14-tile special hand', () => {
        const { hand, display, displayRoot, pickerRoot } = createEntry();
        try {
            displayRoot.querySelector('#btn-special-hand').click();
            hand.tableWind = new Tile(TileType.WIND, 1);
            hand.playerWind = new Tile(TileType.WIND, 1);
            [
                [TileType.BAMBOO, 1], [TileType.BAMBOO, 1],
                [TileType.BAMBOO, 9], [TileType.BAMBOO, 9],
                [TileType.CHARACTER, 1], [TileType.CHARACTER, 1],
                [TileType.CHARACTER, 9], [TileType.CHARACTER, 9],
                [TileType.DOT, 1], [TileType.DOT, 1],
                [TileType.DOT, 9], [TileType.DOT, 9],
                [TileType.BAMBOO, 9], [TileType.BAMBOO, 9]
            ].forEach(([type, num], index) => {
                hand.tiles[index] = new Tile(type, num);
            });
            display.setHand(hand);

            displayRoot.querySelector('.winning-tile-mode-btn').click();
            displayRoot.querySelector('[data-tile-index="13"]').click();

            assert.isTrue(hand.isValid(), 'The terminal-pair hand obeys tile-copy limits');
            assert.isTrue(hand.isComplete(), 'Fourteen tiles and a selected winning tile complete the hand');
            assert.equal(hand.lastTile, 13);
            assert.ok(displayRoot.querySelector('[data-tile-index="13"]').classList.contains('winning-tile'));
            assert.equal(displayRoot.querySelector('.winning-tile-mode-btn').getAttribute('aria-pressed'), 'false');
            assert.isFalse(pickerRoot.classList.contains('open'), 'Choosing the winning tile does not open the tile picker');
        } finally {
            displayRoot.remove();
            pickerRoot.remove();
        }
    });

    it('dims special-hand tiles after four copies are already selected', () => {
        const { hand, display, displayRoot, pickerRoot } = createEntry();
        try {
            displayRoot.querySelector('#btn-special-hand').click();
            const tile = new Tile(TileType.BAMBOO, 9);
            for (let index = 0; index < 4; index++) hand.tiles[index] = tile.clone();
            display.setHand(hand);

            displayRoot.querySelector('[data-tile-index="4"]').click();
            const tileButton = pickerRoot.querySelector(`.mj-tile[data-tile-id="${tile.tileId}"]`);
            assert.ok(tileButton.disabled, 'A fifth copy cannot be selected into another slot');
            assert.equal(getComputedStyle(tileButton).opacity, '0.35', 'Unavailable tiles are visibly dimmed');

            displayRoot.querySelector('[data-tile-index="0"]').click();
            const replacementButton = pickerRoot.querySelector(`.mj-tile[data-tile-id="${tile.tileId}"]`);
            assert.isFalse(replacementButton.disabled,
                'Replacing an existing copy with the same tile does not exceed the four-copy limit');
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
            assert.equal(getComputedStyle(root.querySelector('.flower-slot'), '::after').content, '""');
            root.querySelector('.flower-slot').click();
            assert.ok(hand.hasFlower(tile));
            assert.isTrue(root.querySelector('.flower-slot').classList.contains('active'));
            assert.equal(getComputedStyle(root.querySelector('.flower-slot'), '::after').content, 'none');
            root.querySelector('.flower-slot').click();
            assert.isFalse(hand.hasFlower(tile));
            assert.isFalse(root.querySelector('.flower-slot').classList.contains('active'));
        } finally {
            root.remove();
        }
    });

    it('renders compact icon toggles and keeps their state in sync with the hand', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            const conditions = new SpecialConditions(root);
            const hand = new Hand();
            conditions.setHand(hand);
            assert.equal(root.querySelector('label[for="table-wind-select"]').textContent.trim(), 'Table:');
            assert.equal(root.querySelector('label[for="player-wind-select"]').textContent.trim(), 'Seat:');
            assert.equal(root.querySelectorAll('.condition-toggles .condition-toggle').length, 5);
            assert.equal(root.querySelectorAll('.condition-toggles .condition-toggle img').length, 5);
            const selfDrawn = root.querySelector('#pill-self-drawn');
            assert.equal(selfDrawn.getAttribute('aria-pressed'), 'false');
            selfDrawn.click();
            assert.isTrue(hand.selfDrawn);
            assert.equal(selfDrawn.getAttribute('aria-pressed'), 'true');
        } finally {
            root.remove();
        }
    });

    it('provides a reusable accessible two-state push button', () => {
        let latestState = null;
        const pushButton = new TwoStatePushButton({
            label: 'Test toggle',
            icon: 'img/icons/self-drawn.svg',
            onToggle: pressed => { latestState = pressed; }
        });
        pushButton.element.click();

        assert.equal(pushButton.element.getAttribute('aria-pressed'), 'true');
        assert.isTrue(latestState);
        pushButton.setPressed(false);
        assert.equal(pushButton.element.getAttribute('aria-pressed'), 'false');
    });

    it('highlights and clears tiles attributed to a scoring combination', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            const display = new HandDisplay(root);
            display.setHand(new Hand());
            eventBus.emit(Events.HIGHLIGHT_TILES, {
                highlightGroups: [
                    { meldIndices: [0], tileIndices: [] },
                    { meldIndices: [1], tileIndices: [] }
                ],
                meldIndices: [0, 1],
                tileIndices: []
            });
            assert.equal(root.querySelectorAll('.combination-highlight').length, 6);
            assert.equal(root.querySelectorAll('.combination-highlight-color-0').length, 3);
            assert.equal(root.querySelectorAll('.combination-highlight-color-1').length, 3);

            eventBus.emit(Events.CLEAR_HIGHLIGHT);
            assert.equal(root.querySelectorAll('.combination-highlight').length, 0);
        } finally {
            root.remove();
        }
    });

    it('highlights only the flower slots attributed to a score', () => {
        const root = document.createElement('section');
        document.body.appendChild(root);
        try {
            const flowers = new FlowersBar(root);
            flowers.setHand(new Hand());
            eventBus.emit(Events.HIGHLIGHT_TILES, { flowerIndices: [0, 5] });

            assert.equal(root.querySelectorAll('.flower-slot.combination-highlight').length, 2);
            assert.ok(root.querySelector('.flower-slot[data-index="0"]').classList.contains('combination-highlight-color-0'));
            assert.ok(root.querySelector('.flower-slot[data-index="5"]').classList.contains('combination-highlight-color-1'));

            eventBus.emit(Events.CLEAR_HIGHLIGHT);
            assert.equal(root.querySelectorAll('.flower-slot.combination-highlight').length, 0);
        } finally {
            root.remove();
        }
    });
});
