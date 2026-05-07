package expo.modules.subjectextractor

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.os.Build
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.segmentation.subject.SubjectSegmentation
import com.google.mlkit.vision.segmentation.subject.SubjectSegmenterOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

// Android subject extraction via ML Kit Subject Segmentation.
// Returns a file:// URI to a PNG with the foreground subject on a transparent
// background, written under context.cacheDir. First call downloads a ~5MB
// model silently — wrapper handles UX (loading spinner).
class SubjectExtractorModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SubjectExtractor")

    Function("isSupported") {
      // ML Kit Subject Segmentation requires API 24+ (Android 7.0).
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
    }

    AsyncFunction("extractSubject") { uri: String, promise: Promise ->
      val context = appContext.reactContext
      if (context == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      val bitmap = loadBitmap(context, uri)
      if (bitmap == null) {
        promise.resolve(null)
        return@AsyncFunction
      }
      runSegmentation(context, bitmap, promise)
    }
  }

  private fun loadBitmap(context: Context, uri: String): Bitmap? {
    return try {
      val parsed = Uri.parse(uri)
      val stream = context.contentResolver.openInputStream(parsed) ?: return null
      stream.use { BitmapFactory.decodeStream(it) }
    } catch (e: Exception) {
      null
    }
  }

  private fun runSegmentation(context: Context, bitmap: Bitmap, promise: Promise) {
    val options = SubjectSegmenterOptions.Builder()
      .enableForegroundBitmap()
      .build()
    val segmenter = SubjectSegmentation.getClient(options)
    val image = InputImage.fromBitmap(bitmap, 0)
    segmenter.process(image)
      .addOnSuccessListener { result ->
        val foreground = result.foregroundBitmap
        if (foreground == null) {
          promise.resolve(null)
          return@addOnSuccessListener
        }
        promise.resolve(saveToCache(context, foreground))
      }
      .addOnFailureListener { _ ->
        promise.resolve(null)
      }
  }

  private fun saveToCache(context: Context, bitmap: Bitmap): String? {
    return try {
      val file = File(context.cacheDir, "subject-${UUID.randomUUID()}.png")
      FileOutputStream(file).use { out ->
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
      }
      Uri.fromFile(file).toString()
    } catch (e: Exception) {
      null
    }
  }
}
