import ExpoModulesCore
import Vision
import UIKit
import Photos

// iOS subject extraction via Vision framework (iOS 17+).
// Uses VNGenerateForegroundInstanceMaskRequest — purely headless,
// no UIView/window attach required (avoids ImageAnalysisInteraction footgun).
//
// Returns a file:// URI to a PNG with the foreground subject on a
// transparent background, written under NSTemporaryDirectory().
public class SubjectExtractorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectExtractor")

    Function("isSupported") { () -> Bool in
      if #available(iOS 17.0, *) { return true }
      return false
    }

    AsyncFunction("extractSubject") { (uri: String) -> String? in
      guard #available(iOS 17.0, *) else { return nil }
      guard let image = await Self.loadImage(from: uri),
            let cgImage = image.cgImage else {
        return nil
      }
      guard let cutout = Self.extractForegroundMaskedImage(from: cgImage) else {
        return nil
      }
      return Self.saveToCache(cutout)
    }
  }

  // MARK: - Image loading (file:// or ph://)

  private static func loadImage(from uri: String) async -> UIImage? {
    if uri.hasPrefix("ph://") {
      let identifier = String(uri.dropFirst("ph://".count))
      let assets = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil)
      guard let asset = assets.firstObject else { return nil }
      return await withCheckedContinuation { continuation in
        let opts = PHImageRequestOptions()
        opts.isSynchronous = false
        opts.deliveryMode = .highQualityFormat
        opts.isNetworkAccessAllowed = true
        opts.resizeMode = .none
        PHImageManager.default().requestImage(
          for: asset,
          targetSize: PHImageManagerMaximumSize,
          contentMode: .aspectFit,
          options: opts
        ) { image, _ in
          continuation.resume(returning: image)
        }
      }
    }
    if let url = URL(string: uri),
       let data = try? Data(contentsOf: url) {
      return UIImage(data: data)
    }
    return UIImage(contentsOfFile: uri)
  }

  // MARK: - Vision foreground mask

  @available(iOS 17.0, *)
  private static func extractForegroundMaskedImage(from cgImage: CGImage) -> UIImage? {
    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    let request = VNGenerateForegroundInstanceMaskRequest()
    do {
      try handler.perform([request])
    } catch {
      return nil
    }
    guard let result = request.results?.first else { return nil }
    do {
      let pixelBuffer = try result.generateMaskedImage(
        ofInstances: result.allInstances,
        from: handler,
        croppedToInstancesExtent: true
      )
      let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
      let context = CIContext()
      guard let outputCGImage = context.createCGImage(ciImage, from: ciImage.extent) else {
        return nil
      }
      return UIImage(cgImage: outputCGImage)
    } catch {
      return nil
    }
  }

  // MARK: - Cache write

  private static func saveToCache(_ image: UIImage) -> String? {
    guard let pngData = image.pngData() else { return nil }
    let dir = NSTemporaryDirectory()
    let fileName = "subject-\(UUID().uuidString).png"
    let path = (dir as NSString).appendingPathComponent(fileName)
    let url = URL(fileURLWithPath: path)
    do {
      try pngData.write(to: url)
      return url.absoluteString
    } catch {
      return nil
    }
  }
}
