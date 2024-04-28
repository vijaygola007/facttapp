import React from 'react'
import { Animated, Dimensions } from 'react-native'
import { PinchGestureHandler, State } from 'react-native-gesture-handler'

const screen = Dimensions.get('window')

const PinchableBox = ({ imageUri }) => {
  var scale = new Animated.Value(1)

  var onPinchEvent = Animated.event(
    [
      {
        nativeEvent: { scale: scale }
      }
    ],
    {
      useNativeDriver: true
    }
  )

  var onPinchStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true
      }).start()
    }
  }

  return (
    <PinchGestureHandler
      onGestureEvent={onPinchEvent}
      onHandlerStateChange={onPinchStateChange}>
      <Animated.Image
        source={{ uri: imageUri }}
        style={{
          width: screen.width,
          height: 300,
          transform: [{ scale: scale }]
        }}
        resizeMode='contain'
      />
    </PinchGestureHandler>
  )
}

export default PinchableBox