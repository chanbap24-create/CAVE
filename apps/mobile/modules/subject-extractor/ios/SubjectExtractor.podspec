Pod::Spec.new do |s|
  s.name           = 'SubjectExtractor'
  s.version        = '0.1.0'
  s.summary        = 'On-device subject extraction via VisionKit'
  s.description    = 'iOS subject lifting (iOS 17+) wrapper for Expo'
  s.author         = ''
  s.homepage       = 'https://i-cellar.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
