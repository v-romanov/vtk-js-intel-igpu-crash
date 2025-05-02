// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import "@kitware/vtk.js/Rendering/Profiles/Volume";

import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
import vtkImageData from "@kitware/vtk.js/Common/DataModel/ImageData";
import vtkDataArray from "@kitware/vtk.js/Common/Core/DataArray";
import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";

// Create a rendering container
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// Create the image data
const imageData = vtkImageData.newInstance();

// Define dimensions
const dimensions = [600, 600, 600];
imageData.setDimensions(dimensions);
imageData.setSpacing(1.0, 1.0, 1.0);
imageData.setOrigin(0.0, 0.0, 0.0);

// Create and populate the voxel data using Uint16Array (2 bytes per point)
const voxelCount = dimensions[0] * dimensions[1] * dimensions[2];
const dataArray = new Uint16Array(voxelCount);

// Fill with sample data (sphere in this example)
const center = dimensions.map((d) => d / 2);
const radius = Math.min(...dimensions) / 3;

// 16-bit data ranges from 0 to 65535
const MAX_UINT16_VALUE = 65535;

for (let z = 0; z < dimensions[2]; z++) {
  for (let y = 0; y < dimensions[1]; y++) {
    for (let x = 0; x < dimensions[0]; x++) {
      const index = x + y * dimensions[0] + z * dimensions[0] * dimensions[1];
      const distance = Math.sqrt(
        Math.pow(x - center[0], 2) +
          Math.pow(y - center[1], 2) +
          Math.pow(z - center[2], 2),
      );

      // Using the full 16-bit range
      if (distance < radius) {
        // Inside sphere - scale distance to use full range
        const normalizedDistance = distance / radius;
        dataArray[index] = Math.floor(
          (1.0 - normalizedDistance) * MAX_UINT16_VALUE,
        );
      } else {
        // Outside sphere
        dataArray[index] = 0;
      }
    }
  }
}

// Add the 16-bit data to the image
imageData.getPointData().setScalars(
  vtkDataArray.newInstance({
    name: "Scalars",
    values: dataArray,
    numberOfComponents: 1,
  }),
);

// Create volume mapper and actor
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
mapper.setInputData(imageData);

const actor = vtkVolume.newInstance();
actor.setMapper(mapper);

// Set up color and opacity transfer functions
// Note: These need to be adjusted to the 16-bit range (0-65535)
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 0.0, 0.0, 0.0);
ctfun.addRGBPoint(MAX_UINT16_VALUE / 2, 1.0, 0.5, 0.0);
ctfun.addRGBPoint(MAX_UINT16_VALUE, 1.0, 1.0, 1.0);

const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0, 0.0);
ofun.addPoint(MAX_UINT16_VALUE / 4, 0.0);
ofun.addPoint(MAX_UINT16_VALUE / 2, 0.2);
ofun.addPoint(MAX_UINT16_VALUE, 0.8);

actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setShade(true);

// Add the volume to the renderer
renderer.addVolume(actor);
renderer.resetCamera();
renderWindow.render();
