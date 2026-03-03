# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - banner [ref=e13]:
      - link "TradeSource" [ref=e15] [cursor=pointer]:
        - /url: /
    - main [ref=e16]:
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]:
            - heading "Welcome back" [level=1] [ref=e20]
            - paragraph [ref=e21]: Sign in to continue to your account
          - generic [ref=e22]:
            - generic [ref=e23]:
              - generic [ref=e24]: Email
              - textbox "you@example.com" [ref=e25]
            - generic [ref=e26]:
              - generic [ref=e27]: Password
              - textbox "••••••••" [ref=e28]
            - button "Sign In" [ref=e29]
          - paragraph [ref=e31]:
            - text: Don't have an account?
            - link "Sign up as Contractor" [ref=e32] [cursor=pointer]:
              - /url: /contractor/signup
            - text: or
            - link "Homeowner" [ref=e33] [cursor=pointer]:
              - /url: /homeowner/signup
        - link "Back to home" [ref=e35] [cursor=pointer]:
          - /url: /
          - img [ref=e36]
          - text: Back to home
```