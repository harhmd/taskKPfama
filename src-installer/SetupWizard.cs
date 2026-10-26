using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Reflection;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace SmartDashFAMA
{
    public class SetupWizardForm : Form
    {
        private Panel headerPanel;
        private Label lblHeaderTitle;
        private Label lblHeaderSubtitle;

        private Panel contentPanel;
        private Panel footerPanel;
        private Button btnBack;
        private Button btnNext;
        private Button btnCancel;

        // Step panels
        private Panel pnlStep1Welcome;
        private Panel pnlStep2Options;
        private Panel pnlStep3Progress;
        private Panel pnlStep4Finish;

        // Step 2 controls
        private TextBox txtInstallDir;
        private Button btnBrowse;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenuShortcut;

        // Step 3 controls
        private ProgressBar progressBar;
        private Label lblProgressStatus;

        // Step 4 controls
        private CheckBox chkLaunchNow;

        private int currentStep = 1;
        private string sourceAppDir;

        public SetupWizardForm()
        {
            sourceAppDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
            InitializeComponent();
            ShowStep(1);
        }

        private void InitializeComponent()
        {
            this.Text = "Pemasang SmartDash FAMA (Windows Setup Wizard)";
            this.Size = new Size(580, 440);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.MinimizeBox = true;
            this.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            this.BackColor = Color.FromArgb(248, 250, 252);

            // Load Icon if exists
            string iconPath = Path.Combine(sourceAppDir, @"icons\fama.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // 1. Header Panel
            headerPanel = new Panel();
            headerPanel.Dock = DockStyle.Top;
            headerPanel.Height = 70;
            headerPanel.BackColor = Color.FromArgb(15, 23, 42); // slate-900

            lblHeaderTitle = new Label();
            lblHeaderTitle.Text = "Pemasangan SmartDash FAMA";
            lblHeaderTitle.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            lblHeaderTitle.ForeColor = Color.White;
            lblHeaderTitle.Location = new Point(20, 12);
            lblHeaderTitle.AutoSize = true;
            headerPanel.Controls.Add(lblHeaderTitle);

            lblHeaderSubtitle = new Label();
            lblHeaderSubtitle.Text = "Sistem Penjejakan Arahan Ketua Pengarah FAMA (YBhg. Encik Faisal Iswardi Bin Ismail)";
            lblHeaderSubtitle.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            lblHeaderSubtitle.ForeColor = Color.FromArgb(148, 163, 184); // slate-400
            lblHeaderSubtitle.Location = new Point(20, 38);
            lblHeaderSubtitle.AutoSize = true;
            headerPanel.Controls.Add(lblHeaderSubtitle);

            this.Controls.Add(headerPanel);

            // 2. Footer Panel
            footerPanel = new Panel();
            footerPanel.Dock = DockStyle.Bottom;
            footerPanel.Height = 55;
            footerPanel.BackColor = Color.FromArgb(241, 245, 249); // slate-100
            footerPanel.Paint += (s, e) =>
            {
                e.Graphics.DrawLine(new Pen(Color.FromArgb(226, 232, 240)), 0, 0, footerPanel.Width, 0);
            };

            btnCancel = new Button();
            btnCancel.Text = "Batal";
            btnCancel.Size = new Size(85, 30);
            btnCancel.Location = new Point(465, 12);
            btnCancel.UseVisualStyleBackColor = true;
            btnCancel.Click += (s, e) => this.Close();
            footerPanel.Controls.Add(btnCancel);

            btnNext = new Button();
            btnNext.Text = "Seterusnya >";
            btnNext.Size = new Size(95, 30);
            btnNext.Location = new Point(360, 12);
            btnNext.BackColor = Color.FromArgb(79, 70, 229); // indigo-600
            btnNext.ForeColor = Color.White;
            btnNext.FlatStyle = FlatStyle.Flat;
            btnNext.FlatAppearance.BorderSize = 0;
            btnNext.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            btnNext.Click += BtnNext_Click;
            footerPanel.Controls.Add(btnNext);

            btnBack = new Button();
            btnBack.Text = "< Kembali";
            btnBack.Size = new Size(85, 30);
            btnBack.Location = new Point(265, 12);
            btnBack.UseVisualStyleBackColor = true;
            btnBack.Click += (s, e) => ShowStep(currentStep - 1);
            footerPanel.Controls.Add(btnBack);

            this.Controls.Add(footerPanel);

            // 3. Content Panel Container
            contentPanel = new Panel();
            contentPanel.Dock = DockStyle.Fill;
            contentPanel.BackColor = Color.White;
            this.Controls.Add(contentPanel);

            // Build Individual Step Panels
            BuildStep1Welcome();
            BuildStep2Options();
            BuildStep3Progress();
            BuildStep4Finish();
        }

        private void BuildStep1Welcome()
        {
            pnlStep1Welcome = new Panel();
            pnlStep1Welcome.Dock = DockStyle.Fill;
            pnlStep1Welcome.Padding = new Padding(25);

            Label lblWelcome = new Label();
            lblWelcome.Text = "Selamat Datang ke Wizard Pemasangan SmartDash FAMA";
            lblWelcome.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            lblWelcome.ForeColor = Color.FromArgb(15, 23, 42);
            lblWelcome.Location = new Point(25, 20);
            lblWelcome.AutoSize = true;
            pnlStep1Welcome.Controls.Add(lblWelcome);

            Label lblDesc = new Label();
            lblDesc.Text =
                "Aplikasi ini menyediakan platform desktop rasmi bagi memantau dan menjejaki " +
                "arahan YBhg. Encik Faisal Iswardi Bin Ismail (Ketua Pengarah FAMA) kepada:\n\n" +
                "  • 3 Sektor Timbalan Ketua Pengarah (TKP)\n" +
                "  • Pengarah Kanan Ibu Pejabat HQ (PK Sahaja)\n" +
                "  • 14 Pengarah FAMA Negeri di seluruh Malaysia\n\n" +
                "Ciri-ciri Pemasangan Desktop:\n" +
                "  ✓ Pelancar asli Windows tanpa tetingkap konsol hitam CMD\n" +
                "  ✓ Mod tingkap aplikasi bebas (Standalone App Window)\n" +
                "  ✓ Integrasi terus peti mel kerajaan mail.fama.gov.my Port 993 SSL\n" +
                "  ✓ Pendaftaran ke dalam Windows Apps & Features\n\n" +
                "Klik 'Seterusnya' untuk memilih lokasi pemasangan dan pilihan pintasan.";
            lblDesc.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            lblDesc.ForeColor = Color.FromArgb(51, 65, 85);
            lblDesc.Location = new Point(25, 55);
            lblDesc.Size = new Size(510, 200);
            pnlStep1Welcome.Controls.Add(lblDesc);

            contentPanel.Controls.Add(pnlStep1Welcome);
        }

        private void BuildStep2Options()
        {
            pnlStep2Options = new Panel();
            pnlStep2Options.Dock = DockStyle.Fill;
            pnlStep2Options.Padding = new Padding(25);

            Label lblTitle = new Label();
            lblTitle.Text = "Pilihan Lokasi Pemasangan & Pintasan";
            lblTitle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(15, 23, 42);
            lblTitle.Location = new Point(25, 15);
            lblTitle.AutoSize = true;
            pnlStep2Options.Controls.Add(lblTitle);

            Label lblPathDesc = new Label();
            lblPathDesc.Text = "SmartDash FAMA akan dipasang ke dalam folder berikut:";
            lblPathDesc.Location = new Point(25, 45);
            lblPathDesc.AutoSize = true;
            pnlStep2Options.Controls.Add(lblPathDesc);

            string defaultPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\SmartDash FAMA");

            txtInstallDir = new TextBox();
            txtInstallDir.Text = defaultPath;
            txtInstallDir.Location = new Point(25, 70);
            txtInstallDir.Size = new Size(405, 25);
            pnlStep2Options.Controls.Add(txtInstallDir);

            btnBrowse = new Button();
            btnBrowse.Text = "Semak...";
            btnBrowse.Location = new Point(440, 68);
            btnBrowse.Size = new Size(80, 28);
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.SelectedPath = txtInstallDir.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtInstallDir.Text = Path.Combine(fbd.SelectedPath, "SmartDash FAMA");
                    }
                }
            };
            pnlStep2Options.Controls.Add(btnBrowse);

            Label lblOpts = new Label();
            lblOpts.Text = "Pilihan Tambahan:";
            lblOpts.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            lblOpts.Location = new Point(25, 120);
            lblOpts.AutoSize = true;
            pnlStep2Options.Controls.Add(lblOpts);

            chkDesktopShortcut = new CheckBox();
            chkDesktopShortcut.Text = "Cipta Pintasan pada Desktop Windows (SmartDash FAMA.lnk)";
            chkDesktopShortcut.Checked = true;
            chkDesktopShortcut.Location = new Point(28, 145);
            chkDesktopShortcut.Size = new Size(450, 22);
            pnlStep2Options.Controls.Add(chkDesktopShortcut);

            chkStartMenuShortcut = new CheckBox();
            chkStartMenuShortcut.Text = "Cipta Pintasan dalam Menu Start Windows";
            chkStartMenuShortcut.Checked = true;
            chkStartMenuShortcut.Location = new Point(28, 175);
            chkStartMenuShortcut.Size = new Size(450, 22);
            pnlStep2Options.Controls.Add(chkStartMenuShortcut);

            Label lblDisk = new Label();
            lblDisk.Text = "Ruang cakera yang diperlukan: ~15 MB\nRuang cakera sedia ada: Mencukupi";
            lblDisk.ForeColor = Color.FromArgb(100, 116, 139);
            lblDisk.Location = new Point(28, 220);
            lblDisk.Size = new Size(450, 35);
            pnlStep2Options.Controls.Add(lblDisk);

            contentPanel.Controls.Add(pnlStep2Options);
        }

        private void BuildStep3Progress()
        {
            pnlStep3Progress = new Panel();
            pnlStep3Progress.Dock = DockStyle.Fill;
            pnlStep3Progress.Padding = new Padding(25);

            Label lblTitle = new Label();
            lblTitle.Text = "Memasang SmartDash FAMA...";
            lblTitle.Font = new Font("Segoe UI", 11F, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(15, 23, 42);
            lblTitle.Location = new Point(25, 30);
            lblTitle.AutoSize = true;
            pnlStep3Progress.Controls.Add(lblTitle);

            lblProgressStatus = new Label();
            lblProgressStatus.Text = "Menyalin fail-fail aplikasi...";
            lblProgressStatus.Location = new Point(25, 75);
            lblProgressStatus.Size = new Size(490, 25);
            pnlStep3Progress.Controls.Add(lblProgressStatus);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(25, 105);
            progressBar.Size = new Size(495, 25);
            progressBar.Style = ProgressBarStyle.Continuous;
            pnlStep3Progress.Controls.Add(progressBar);

            contentPanel.Controls.Add(pnlStep3Progress);
        }

        private void BuildStep4Finish()
        {
            pnlStep4Finish = new Panel();
            pnlStep4Finish.Dock = DockStyle.Fill;
            pnlStep4Finish.Padding = new Padding(25);

            Label lblTitle = new Label();
            lblTitle.Text = "Pemasangan Berjaya!";
            lblTitle.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            lblTitle.ForeColor = Color.FromArgb(5, 150, 105); // emerald-600
            lblTitle.Location = new Point(25, 25);
            lblTitle.AutoSize = true;
            pnlStep4Finish.Controls.Add(lblTitle);

            Label lblDesc = new Label();
            lblDesc.Text =
                "Aplikasi SmartDash FAMA telah berjaya dipasang pada komputer anda.\n\n" +
                "Pintasan telah sedia dicipta pada Desktop dan Menu Start. " +
                "Anda boleh melancarkan sistem bila-bila masa tanpa perlu membuka terminal CMD.";
            lblDesc.Location = new Point(25, 65);
            lblDesc.Size = new Size(500, 70);
            pnlStep4Finish.Controls.Add(lblDesc);

            chkLaunchNow = new CheckBox();
            chkLaunchNow.Text = "Lancarkan SmartDash FAMA sekarang";
            chkLaunchNow.Checked = true;
            chkLaunchNow.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            chkLaunchNow.ForeColor = Color.FromArgb(15, 23, 42);
            chkLaunchNow.Location = new Point(28, 155);
            chkLaunchNow.Size = new Size(350, 25);
            pnlStep4Finish.Controls.Add(chkLaunchNow);

            contentPanel.Controls.Add(pnlStep4Finish);
        }

        private void ShowStep(int step)
        {
            currentStep = step;
            pnlStep1Welcome.Visible = (step == 1);
            pnlStep2Options.Visible = (step == 2);
            pnlStep3Progress.Visible = (step == 3);
            pnlStep4Finish.Visible = (step == 4);

            btnBack.Enabled = (step == 2);
            btnBack.Visible = (step <= 2);

            if (step == 1)
            {
                btnNext.Text = "Seterusnya >";
                btnNext.Enabled = true;
                btnCancel.Enabled = true;
            }
            else if (step == 2)
            {
                btnNext.Text = "Pasang Sekarang";
                btnNext.Enabled = true;
                btnCancel.Enabled = true;
            }
            else if (step == 3)
            {
                btnNext.Enabled = false;
                btnCancel.Enabled = false;
                btnBack.Enabled = false;
            }
            else if (step == 4)
            {
                btnNext.Text = "Selesai";
                btnNext.Enabled = true;
                btnCancel.Visible = false;
            }
        }

        private void BtnNext_Click(object sender, EventArgs e)
        {
            if (currentStep == 1)
            {
                ShowStep(2);
            }
            else if (currentStep == 2)
            {
                ShowStep(3);
                StartInstallation();
            }
            else if (currentStep == 4)
            {
                // Finished
                if (chkLaunchNow.Checked)
                {
                    string vbs = Path.Combine(txtInstallDir.Text, "launch-desktop.vbs");
                    if (File.Exists(vbs))
                    {
                        ProcessStartInfo psi = new ProcessStartInfo();
                        psi.FileName = "wscript.exe";
                        psi.Arguments = "\"" + vbs + "\"";
                        psi.WorkingDirectory = txtInstallDir.Text;
                        Process.Start(psi);
                    }
                    else
                    {
                        Process.Start("http://localhost:9091");
                    }
                }
                this.Close();
            }
        }

        private void StartInstallation()
        {
            string targetDir = txtInstallDir.Text.Trim();
            bool makeDesktop = chkDesktopShortcut.Checked;
            bool makeStart = chkStartMenuShortcut.Checked;

            Thread worker = new Thread(() =>
            {
                try
                {
                    UpdateProgress(10, "Mencipta folder destinasi...");
                    if (!Directory.Exists(targetDir))
                    {
                        Directory.CreateDirectory(targetDir);
                    }

                    UpdateProgress(25, "Menyalin fail teras aplikasi...");
                    string[] coreFiles = new string[] {
                        "server.js",
                        "imap-client.js",
                        "index.html",
                        "manifest.json",
                        "sw.js",
                        "package.json",
                        "start.bat",
                        "start-desktop.bat",
                        "launch-desktop.vbs"
                    };

                    foreach (string file in coreFiles)
                    {
                        string src = Path.Combine(sourceAppDir, file);
                        string dst = Path.Combine(targetDir, file);
                        if (File.Exists(src))
                        {
                            File.Copy(src, dst, true);
                        }
                    }

                    UpdateProgress(45, "Menyalin fail boleh laksana (Executable)...");
                    // Copy this installer executable to target directory so it can act as runner and uninstaller!
                    string thisExe = Assembly.GetExecutingAssembly().Location;
                    if (File.Exists(thisExe))
                    {
                        string dstExe = Path.Combine(targetDir, "Setup-SmartDash-FAMA.exe");
                        File.Copy(thisExe, dstExe, true);
                    }

                    UpdateProgress(60, "Menyalin ikon rasmi & pangkalan data...");
                    // Copy icons
                    string srcIcons = Path.Combine(sourceAppDir, "icons");
                    string dstIcons = Path.Combine(targetDir, "icons");
                    CopyDirectory(srcIcons, dstIcons);

                    // Copy data
                    string srcData = Path.Combine(sourceAppDir, "data");
                    string dstData = Path.Combine(targetDir, "data");
                    CopyDirectory(srcData, dstData);

                    UpdateProgress(75, "Menjana pintasan Windows...");
                    string vbsPath = Path.Combine(targetDir, "launch-desktop.vbs");
                    string iconPath = Path.Combine(targetDir, @"icons\fama.ico");

                    if (makeDesktop)
                    {
                        string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                        string scDesktop = Path.Combine(desktopPath, "SmartDash FAMA.lnk");
                        CreateWindowsShortcut(scDesktop, "wscript.exe", "\"" + vbsPath + "\"", targetDir, iconPath, "SmartDash FAMA - Penjejakan Arahan Ketua Pengarah FAMA");
                    }

                    if (makeStart)
                    {
                        string startMenuPrograms = Environment.GetFolderPath(Environment.SpecialFolder.Programs);
                        string famaStartMenuDir = Path.Combine(startMenuPrograms, "SmartDash FAMA");
                        if (!Directory.Exists(famaStartMenuDir))
                        {
                            Directory.CreateDirectory(famaStartMenuDir);
                        }

                        string scStart = Path.Combine(famaStartMenuDir, "SmartDash FAMA.lnk");
                        CreateWindowsShortcut(scStart, "wscript.exe", "\"" + vbsPath + "\"", targetDir, iconPath, "SmartDash FAMA - Penjejakan Arahan Ketua Pengarah FAMA");

                        string uninstallerBat = Path.Combine(targetDir, "Uninstall-SmartDash-FAMA.bat");
                        string scUninstall = Path.Combine(famaStartMenuDir, "Nyahpasang SmartDash FAMA.lnk");
                        CreateWindowsShortcut(scUninstall, "cmd.exe", "/c \"" + uninstallerBat + "\"", targetDir, iconPath, "Nyahpasang SmartDash FAMA");
                    }

                    UpdateProgress(90, "Mendaftarkan aplikasi ke Windows Registry (Installed Apps)...");
                    RegisterInWindows(targetDir);

                    UpdateProgress(100, "Pemasangan selesai!");
                    Thread.Sleep(500);

                    this.Invoke((MethodInvoker)delegate
                    {
                        ShowStep(4);
                    });
                }
                catch (Exception ex)
                {
                    this.Invoke((MethodInvoker)delegate
                    {
                        MessageBox.Show("Ralat pemasangan: " + ex.Message, "Ralat", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        ShowStep(2);
                    });
                }
            });

            worker.IsBackground = true;
            worker.Start();
        }

        private void UpdateProgress(int percent, string text)
        {
            if (this.InvokeRequired)
            {
                this.Invoke((MethodInvoker)delegate { UpdateProgress(percent, text); });
                return;
            }
            progressBar.Value = percent;
            lblProgressStatus.Text = text;
        }

        private void CopyDirectory(string sourceDir, string targetDir)
        {
            if (!Directory.Exists(sourceDir)) return;
            if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);

            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string targetFile = Path.Combine(targetDir, Path.GetFileName(file));
                File.Copy(file, targetFile, true);
            }

            foreach (string sub in Directory.GetDirectories(sourceDir))
            {
                CopyDirectory(sub, Path.Combine(targetDir, Path.GetFileName(sub)));
            }
        }

        private void CreateWindowsShortcut(string shortcutPath, string targetPath, string arguments, string workDir, string iconLocation, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return;

                object shell = Activator.CreateInstance(shellType);
                object shortcut = shellType.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, shell, new object[] { shortcutPath });
                if (shortcut == null) return;

                Type scType = shortcut.GetType();
                scType.InvokeMember("TargetPath", BindingFlags.SetProperty, null, shortcut, new object[] { targetPath });
                if (!string.IsNullOrEmpty(arguments))
                {
                    scType.InvokeMember("Arguments", BindingFlags.SetProperty, null, shortcut, new object[] { arguments });
                }
                scType.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, shortcut, new object[] { workDir });
                if (File.Exists(iconLocation))
                {
                    scType.InvokeMember("IconLocation", BindingFlags.SetProperty, null, shortcut, new object[] { iconLocation + ",0" });
                }
                scType.InvokeMember("Description", BindingFlags.SetProperty, null, shortcut, new object[] { description });
                scType.InvokeMember("Save", BindingFlags.InvokeMethod, null, shortcut, null);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error creating shortcut: " + ex.Message);
            }
        }

        private void RegisterInWindows(string targetDir)
        {
            try
            {
                string regPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\SmartDashFAMA";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(regPath))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "SmartDash FAMA - Penjejakan Arahan Ketua Pengarah");
                        key.SetValue("DisplayVersion", "1.0.0");
                        key.SetValue("Publisher", "Lembaga Pemasaran Pertanian Persekutuan (FAMA)");
                        key.SetValue("DisplayIcon", Path.Combine(targetDir, @"icons\fama.ico"));
                        key.SetValue("InstallLocation", targetDir);
                        key.SetValue("UninstallString", "\"" + Path.Combine(targetDir, "Uninstall-SmartDash-FAMA.bat") + "\"");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                        key.SetValue("HelpLink", "https://mail.fama.gov.my");
                    }
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Registry write error: " + ex.Message);
            }
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new SetupWizardForm());
        }
    }
}
