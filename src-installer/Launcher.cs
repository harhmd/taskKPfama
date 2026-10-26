using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

namespace SmartDashFAMA
{
    public class LauncherDialogForm : Form
    {
        private Label lblTitle;
        private Label lblSubtitle;
        private Label lblStatus;
        private ProgressBar progressBar;
        private Button btnLaunch;
        private System.Windows.Forms.Timer timer;

        public LauncherDialogForm()
        {
            this.Text = "SmartDash FAMA";
            this.Size = new Size(460, 240);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(248, 250, 252);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string iconPath = Path.Combine(appDir, @"icons\fama.ico");
            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            Panel topPanel = new Panel();
            topPanel.Dock = DockStyle.Top;
            topPanel.Height = 65;
            topPanel.BackColor = Color.FromArgb(15, 23, 42); // slate-900

            lblTitle = new Label();
            lblTitle.Text = "SmartDash FAMA";
            lblTitle.Font = new Font("Segoe UI", 12F, FontStyle.Bold);
            lblTitle.ForeColor = Color.White;
            lblTitle.Location = new Point(20, 12);
            lblTitle.AutoSize = true;
            topPanel.Controls.Add(lblTitle);

            lblSubtitle = new Label();
            lblSubtitle.Text = "Penjejakan Arahan Ketua Pengarah FAMA";
            lblSubtitle.Font = new Font("Segoe UI", 8.5F, FontStyle.Regular);
            lblSubtitle.ForeColor = Color.FromArgb(148, 163, 184);
            lblSubtitle.Location = new Point(20, 36);
            lblSubtitle.AutoSize = true;
            topPanel.Controls.Add(lblSubtitle);
            this.Controls.Add(topPanel);

            lblStatus = new Label();
            lblStatus.Text = "Menghubungkan pelayan tempatan (Port 9091)...";
            lblStatus.Location = new Point(20, 85);
            lblStatus.Size = new Size(400, 20);
            this.Controls.Add(lblStatus);

            progressBar = new ProgressBar();
            progressBar.Location = new Point(20, 110);
            progressBar.Size = new Size(400, 18);
            progressBar.Style = ProgressBarStyle.Marquee;
            progressBar.MarqueeAnimationSpeed = 25;
            this.Controls.Add(progressBar);

            btnLaunch = new Button();
            btnLaunch.Text = "Buka Sekarang";
            btnLaunch.Size = new Size(110, 30);
            btnLaunch.Location = new Point(310, 150);
            btnLaunch.BackColor = Color.FromArgb(79, 70, 229);
            btnLaunch.ForeColor = Color.White;
            btnLaunch.FlatStyle = FlatStyle.Flat;
            btnLaunch.FlatAppearance.BorderSize = 0;
            btnLaunch.Click += (s, e) => { LaunchAppAndExit(); };
            this.Controls.Add(btnLaunch);

            timer = new System.Windows.Forms.Timer();
            timer.Interval = 500;
            timer.Tick += (s, e) =>
            {
                if (IsServerRunning())
                {
                    timer.Stop();
                    LaunchAppAndExit();
                }
                else
                {
                    StartServer();
                }
            };
            timer.Start();
        }

        private bool IsServerRunning()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://localhost:9091/api/stats");
                req.Timeout = 600;
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
            }
            catch
            {
                return false;
            }
        }

        private void StartServer()
        {
            try
            {
                string appDir = AppDomain.CurrentDomain.BaseDirectory;
                string serverJs = Path.Combine(appDir, "server.js");
                if (File.Exists(serverJs))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = "node.exe";
                    psi.Arguments = "\"" + serverJs + "\"";
                    psi.WorkingDirectory = appDir;
                    psi.CreateNoWindow = true;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                }
            }
            catch { }
        }

        private void LaunchAppAndExit()
        {
            try
            {
                string edge = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
                if (File.Exists(edge))
                {
                    Process.Start(edge, "--app=http://localhost:9091");
                }
                else
                {
                    Process.Start("http://localhost:9091");
                }
            }
            catch { }
            this.Close();
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new LauncherDialogForm());
        }
    }
}
