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

    AsyncFunction("extractSubject") { (uri: String) async -> String? in
      guard #available(iOS 17.0, *) else {
        NSLog("[SubjectExtractor] iOS<17, returning nil")
        return nil
      }
      guard let image = await Self.loadImage(from: uri) else {
        NSLog("[SubjectExtractor] loadImage failed uri=%@", uri)
        return nil
      }
      guard let cgImage = image.cgImage else {
        NSLog("[SubjectExtractor] no cgImage")
        return nil
      }
      guard let cutout = Self.extractForegroundMaskedImage(from: cgImage) else {
        NSLog("[SubjectExtractor] extractForegroundMaskedImage returned nil")
        return nil
      }
      let saved = Self.saveToCache(cutout)
      NSLog("[SubjectExtractor] saved=%@", saved ?? "nil")
      return saved
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
      NSLog("[SubjectExtractor] handler.perform threw: %@", String(describing: error))
      return nil
    }
    guard let result = request.results?.first else {
      NSLog("[SubjectExtractor] no Vision results — 피사체 미검출")
      return nil
    }
    // 인스턴스가 비어있으면 generateMaskedImage 호출 의미 없음.
    guard !result.allInstances.isEmpty else {
      NSLog("[SubjectExtractor] allInstances empty")
      return nil
    }
    do {
      let pixelBuffer = try result.generateMaskedImage(
        ofInstances: result.allInstances,
        from: handler,
        croppedToInstancesExtent: true
      )
      let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
      let context = CIContext()
      guard let outputCGImage = context.createCGImage(ciImage, from: ciImage.extent) else {
        NSLog("[SubjectExtractor] CIContext createCGImage returned nil")
        return nil
      }
      return UIImage(cgImage: outputCGImage)
    } catch {
      NSLog("[SubjectExtractor] generateMaskedImage threw: %@", String(describing: error))
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
