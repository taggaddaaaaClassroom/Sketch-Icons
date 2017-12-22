import utils from '../utils/utils'
import logger from '../utils/logger'
import librairiesProvider from './libraries'

export default {
  initAddMaskOnSelectedArtboards,
  addMask,
  formatSvg,
  dedupeLayers,
  applyMask
}

/**
 * @name initAddMaskOnSelectedArtboards
 * @description main function to add mask on selected artboards
 * @param context {Object}
 * @param params {Object}
 * @param artboards {Array} : MSArtboardGroup
 */
function initAddMaskOnSelectedArtboards(context, params, artboards) {
  artboards.forEach(function (artboard) {
    if(utils.isArtboardMasked(artboard.object)){
      MSMaskWithShape.toggleMaskForSingleShape(artboard.object.layers()[0])
      artboard.object.layers()[1].removeFromParent()
    }
    addMask(context, artboard.object, params)
  })
  utils.clearSelection(context)
}

/**
 * @name addMask
 * @description index function for all step to add mask and convert artboard to symbol at end
 * @param context {Object}
 * @param currentArtboard {Object} : MSArtboardGroup
 * @param params {Object}
 */
function addMask(context, currentArtboard, params) {
  let mask = (params.mask) ? params.mask : null
  formatSvg(currentArtboard)
  dedupeLayers(currentArtboard)
  if(params.color){
    mask = getMaskSymbolFromLib(context, currentArtboard, params.color, params.colorLib)
  }else if(params.colorPicker){
    mask = createMaskFromNean(context, currentArtboard, params.colorPicker)
  }
  applyMask(currentArtboard, mask)
}


/**
 * @name createMaskFromNean
 * @param context
 * @param currentArtboard
 * @param color
 * @return {Object} : MSShapeGroup
 */
function createMaskFromNean(context, currentArtboard, color){
  const currentArtboardSize = currentArtboard.rect()

  const mask = MSShapeGroup.shapeWithRect({origin:{x:0, y:0}, size:{width:currentArtboardSize.size.width, height:currentArtboardSize.size.height}})
  const fill = mask.style().addStylePartOfType(0);
  fill.color = color;

  return mask
}

/**
 * @name createMask
 * @description add mask from symbol master colors library to one artboard
 * @param context {Object}
 * @param currentArtboard {Object} : MSArtboardGroup
 * @param colorSymbolMaster {Object}
 * @param colorLibrary {Object} : MSAssetLibrary
 * @return symbol {Object} : MSSymbolInstance
 */
function getMaskSymbolFromLib(context, currentArtboard, colorSymbolMaster, colorLibrary) {
  utils.clearSelection(context)
  const librairiesController = AppController.sharedInstance().librariesController()

  const symbolMaster = (colorLibrary) ? librairiesController.importForeignSymbol_fromLibrary_intoDocument(colorSymbolMaster, colorLibrary, context.document.documentData()).symbolMaster() : colorSymbolMaster
  return symbolMaster.newSymbolInstance();
}

/**
 * @name applyMask
 * @param currentArtboard
 * @param symbolInstance
 */
function applyMask(currentArtboard, mask){
  const currentArtboardSize = currentArtboard.rect()
  mask.setHeightRespectingProportions(currentArtboardSize.size.height)
  mask.setWidthRespectingProportions(currentArtboardSize.size.width)
  mask.setName('🎨 color')
  currentArtboard.addLayer(mask);
  MSMaskWithShape.toggleMaskForSingleShape(currentArtboard.layers()[0])
}

/**
 * @name formatSvg
 * @description ungroup all layers in an artboard
 * @param currentArtboard {Object} : MSArtboardGroup
 */
function formatSvg(currentArtboard, onlyLayer = false) {
  currentArtboard.children().forEach(function (layer) {
    const layerClass = String(layer.class())
    if (layerClass === "MSLayerGroup" || (layerClass === "MSShapeGroup" && !onlyLayer)) {
      layer.ungroup()
    }
  })
}

/**
 * @name dedupeLayers
 * @description get all shapes and merge them in one shape group
 * @param currentArtboard {Object} : MSArtboardGroup
 */
function dedupeLayers(currentArtboard) {
  const container = MSShapeGroup.shapeWithRect(null)
  container.setName('container-random-string-9246392')
  currentArtboard.addLayer(container)
  const reg = new RegExp("Shape");

  currentArtboard.children().forEach(function (layer) {

    const layerClass = String(layer.class())

    if (layerClass === 'MSRectangleShape' && String(layer.name()) === 'container-random-string-9246392') {
      return layer.removeFromParent()
    }

    if (reg.test(layerClass) && layerClass !== 'MSShapeGroup') {
      layer.moveToLayer_beforeLayer(container, layer);
    }
  })


  const fill = container.style().addStylePartOfType(0);
  fill.color = MSColor.blackColor();
  // container.style.fills = [MSColor.blackColor()]
  container.setName("icon")
  container.resizeToFitChildrenWithOption(0)
}