class Castov < Formula
  desc "Fast, offline developer utilities & MCP server in your terminal"
  homepage "https://castov.com"
  url "https://registry.npmjs.org/castov/-/castov-1.3.3.tgz"
  sha256 "dbd74e5bd91a51d2bda814768871cd7d65df01f9e5685989540e1180d09d2d00"
  license "MIT"

  depends_on "node"

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec)
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "1.3.3", shell_output("#{bin}/castov --version")
    assert_match "UUID", shell_output("#{bin}/castov uuid")
  end
end
