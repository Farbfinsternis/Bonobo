; Test for Runtime Library Integration
Graphics 640, 480

While Not KeyDown(1)
    Cls

    ; Test Graphics & Draw Wrappers
    Color 0, 255, 0
    Rect 10, 10, 100, 100, 1

    Color 255, 0, 0
    Oval 120, 10, 100, 100, 1

    Color 255, 255, 255
    Text 10, 130, "RTL Integration Test Successful"

    ; Test Math Wrapper
    val = Sin(90)
    Text 10, 150, "Sin(90) = " + val

    ; Test String Wrapper
    s$ = Mid("Hello World", 7, 5)
    Text 10, 170, "Mid('Hello World', 7, 5) = " + s$

    Flip
Wend
End