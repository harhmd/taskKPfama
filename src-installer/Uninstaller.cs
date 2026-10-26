using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using Microsoft.Win32;

namespace SmartDashFAMA
{
    static class Uninstaller
    {
        [STAThread]
        static void Main()
        {
            try
            {
                DialogResult confirm = MessageBox.Show(
                    "Adakah anda pasti ingin menyahpasang SmartDash FAMA dari komputer anda?",
                    "Nyahpasang SmartDash FAMA",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Question);

                if (confirm != DialogResult.Yes)
                {
                    return;
                }

                string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

                // 1. Remove Desktop shortcut
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string desktopShortcut = Path.Combine(desktopPath, "SmartDash FAMA.lnk");
                if (File.Exists(desktopShortcut))
                {
                    try { File.Delete(desktopShortcut); } catch { }
                }

                // 2. Remove Start Menu shortcut & folder
                string startMenuPrograms = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                string famaStartMenuDir = Path.Combine(startMenuPrograms, "SmartDash FAMA");
                if (Directory.Exists(famaStartMenuDir))
                {
                    try { Directory.Delete(famaStartMenuDir, true); } catch { }
                }

                // 3. Remove Windows Registry registration (Add or Remove Programs)
                try
                {
                    using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall", true))
                    {
                        if (key != null)
                        {
                            key.DeleteSubKeyTree("SmartDashFAMA", false);
                        }
                    }
                }
                catch { }

                // 4. Schedule directory removal after uninstaller exits
                string cmdScript = string.Format(
                    "/c timeout /t 2 /nobreak > NUL & rmdir /s /q \"{0}\"",
                    appDir);

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = cmdScript;
                psi.CreateNoWindow = true;
                psi.WindowStyle = ProcessWindowStyle.Hidden;
                psi.UseShellExecute = false;
                Process.Start(psi);

                MessageBox.Show(
                    "SmartDash FAMA telah berjaya dinyahpasang daripada komputer ini.",
                    "Nyahpasang Selesai",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Ralat semasa menyahpasang: " + ex.Message,
                    "Ralat Nyahpasang",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }
    }
}
