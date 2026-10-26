Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get directory of this script
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Check if server is already running by making a fast HTTP request
isServerRunning = False
On Error Resume Next
Set xmlHttp = CreateObject("MSXML2.ServerXMLHTTP.6.0")
xmlHttp.Open "GET", "http://localhost:9091/api/stats", False
xmlHttp.setTimeouts 1000, 1000, 1000, 1000
xmlHttp.Send
If Err.Number = 0 Then
    If xmlHttp.Status = 200 Then
        isServerRunning = True
    End If
End If
Err.Clear
On Error GoTo 0

' If server not running, start node server.js silently (style 0 = hidden)
If Not isServerRunning Then
    WshShell.CurrentDirectory = scriptDir
    WshShell.Run "cmd /c node server.js", 0, False
    WScript.Sleep 1500
End If

' Find Microsoft Edge or Google Chrome to launch in standalone --app window mode
edgePathX86 = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
edgePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
chromePath = WshShell.ExpandEnvironmentStrings("%ProgramFiles%\Google\Chrome\Application\chrome.exe")
chromePathX86 = WshShell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe")

browserExe = ""
If fso.FileExists(edgePathX86) Then
    browserExe = edgePathX86
ElseIf fso.FileExists(edgePath) Then
    browserExe = edgePath
ElseIf fso.FileExists(chromePath) Then
    browserExe = chromePath
ElseIf fso.FileExists(chromePathX86) Then
    browserExe = chromePathX86
End If

If browserExe <> "" Then
    WshShell.Run """" & browserExe & """ --app=http://localhost:9091", 1, False
Else
    WshShell.Run "http://localhost:9091", 1, False
End If
