import { expect } from "chai";
import sinon from "sinon";
import { afterEach, describe, it } from "mocha-globals";
import { FRAME_SIZE } from "../../sources/state/constants.ts";
import { createCatalog } from "../../sources/state/catalog.ts";
import {
  clearDisabledDirectionRows,
  getEnabledDirections,
  getPreviewDirectionIndexes,
  packDirectionBand,
  packEnabledDirectionSheet,
} from "../../sources/state/directions.ts";
import { randomizeOutfit } from "../../sources/state/random-outfit.ts";
import {
  configureStateCatalog,
  createState,
} from "../../sources/state/state.ts";
import { seedCatalog } from "../browser-catalog-fixture.js";

const ALL_BODIES = ["male", "female", "teen", "child", "muscular", "pregnant"];

describe("direction filters", () => {
  it("starts with every animation and all four directions enabled", () => {
    const state = createState();
    expect(state.enabledAnimations.walk).to.equal(true);
    expect(state.enabledAnimations.hurt).to.equal(true);
    expect(state.enabledDirections).to.deep.equal({
      up: true,
      left: true,
      down: true,
      right: true,
    });
    expect(getEnabledDirections(state)).to.deep.equal([
      "up",
      "left",
      "down",
      "right",
    ]);
    expect(getPreviewDirectionIndexes(state, 4)).to.deep.equal([0, 1, 2, 3]);
  });

  it("keeps only left and right when up and down are unchecked", () => {
    const state = createState();
    state.enabledDirections.up = false;
    state.enabledDirections.down = false;
    expect(getEnabledDirections(state)).to.deep.equal(["left", "right"]);
    expect(getPreviewDirectionIndexes(state, 4)).to.deep.equal([1, 3]);
    expect(getPreviewDirectionIndexes(state, 1)).to.deep.equal([]);
  });

  it("clears disabled facing rows on the sheet", () => {
    const sheet = document.createElement("canvas");
    sheet.width = 8;
    sheet.height = FRAME_SIZE * 4;
    const ctx = sheet.getContext("2d");
    expect(ctx).to.not.equal(null);
    ctx!.fillStyle = "#ff0000";
    ctx!.fillRect(0, 0, sheet.width, sheet.height);

    const state = createState();
    state.enabledDirections.up = false;
    state.enabledDirections.down = false;
    clearDisabledDirectionRows(sheet, state);

    const read = sheet.getContext("2d")!;
    expect(read.getImageData(0, 0, 1, 1).data[3]).to.equal(0);
    expect(read.getImageData(0, FRAME_SIZE, 1, 1).data[3]).to.equal(255);
    expect(read.getImageData(0, FRAME_SIZE * 2, 1, 1).data[3]).to.equal(0);
    expect(read.getImageData(0, FRAME_SIZE * 3, 1, 1).data[3]).to.equal(255);
  });

  it("packs a sheet so unchecked directions do not keep their rows", () => {
    const sheet = document.createElement("canvas");
    sheet.width = 4;
    sheet.height = FRAME_SIZE * 4;
    const ctx = sheet.getContext("2d")!;
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(0, FRAME_SIZE * 3, sheet.width, FRAME_SIZE);

    const packed = packEnabledDirectionSheet(sheet, ["right"]);
    expect(packed.height).to.equal(FRAME_SIZE);
    const pixel = packed.getContext("2d")!.getImageData(0, 0, 1, 1).data;
    expect(pixel[1]).to.equal(255);
  });

  it("packs one animation band down to the checked facing", () => {
    const band = document.createElement("canvas");
    band.width = 4;
    band.height = FRAME_SIZE * 4;
    const ctx = band.getContext("2d")!;
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, FRAME_SIZE, band.width, FRAME_SIZE);

    const packed = packDirectionBand(band, ["left"], FRAME_SIZE, 4);
    expect(packed.height).to.equal(FRAME_SIZE);
    expect(packed.getContext("2d")!.getImageData(0, 0, 1, 1).data[2]).to.equal(
      255,
    );
  });
});

describe("randomizeOutfit", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("always includes a body and a head that fit the chosen body type", () => {
    const { reader, writer } = createCatalog();
    configureStateCatalog(reader);
    const state = createState();
    seedCatalog(writer, {
      body_item: {
        name: "Body",
        type_name: "body",
        required: ALL_BODIES,
        animations: ["walk"],
        variants: [],
        recolors: [{ variants: ["light"] }],
        credits: [],
        layers: {},
        path: [],
        matchBodyColor: true,
      },
      head_item: {
        name: "Head",
        type_name: "head",
        required: ALL_BODIES,
        animations: ["walk"],
        variants: ["light"],
        recolors: [],
        credits: [],
        layers: {},
        path: [],
        matchBodyColor: true,
      },
      hat_item: {
        name: "Hat",
        type_name: "hat",
        required: ["male"],
        animations: ["walk"],
        variants: ["red"],
        recolors: [],
        credits: [],
        layers: {},
        path: [],
      },
    });

    sinon.stub(Math, "random").returns(0);
    randomizeOutfit(reader, state);

    const ids = Object.values(state.selections).map(
      (selection) => selection.itemId,
    );
    expect(state.bodyType).to.equal("male");
    expect(ids).to.include("body_item");
    expect(ids).to.include("head_item");
    expect(ids).to.include("hat_item");
  });
});
