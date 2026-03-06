import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SiteFooter from "@/components/site-footer";

export default function QAPage() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">常見問題</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            為您整理了最常見的問題，讓您快速了解劇本殺的相關資訊
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          <Badge variant="default" className="cursor-pointer">全部問題</Badge>
          <Badge variant="outline" className="cursor-pointer">預約相關</Badge>
          <Badge variant="outline" className="cursor-pointer">遊戲規則</Badge>
          <Badge variant="outline" className="cursor-pointer">場地資訊</Badge>
          <Badge variant="outline" className="cursor-pointer">費用說明</Badge>
        </div>

        {/* FAQ Content */}
        <div className="space-y-6">
          {/* 預約相關 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">預約相關</Badge>
                預約與時間安排
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 需要提前多久預約？</h4>
                <p className="text-muted-foreground">A: 建議提前1-3天預約，熱門時段建議提前一週。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 可以現場排隊嗎？</h4>
                <p className="text-muted-foreground">A: 可以，但不保證有位置，建議事先預約。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 預約後可以取消或更改嗎？</h4>
                <p className="text-muted-foreground">A: 可以，但請至少提前24小時通知。當日取消將收取全額費用。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 遲到了怎麼辦？</h4>
                <p className="text-muted-foreground">A: 請準時到達，遲到超過15分鐘可能影響遊戲體驗，嚴重遲到可能無法參與。</p>
              </div>
            </CardContent>
          </Card>

          {/* 遊戲規則 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">遊戲規則</Badge>
                遊戲進行與規則
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 第一次玩劇本殺，需要準備什麼嗎？</h4>
                <p className="text-muted-foreground">A: 不需要特別準備，只要帶著開放的心態和想像力即可。我們的主持人會詳細說明規則。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 遊戲過程中可以使用手機嗎？</h4>
                <p className="text-muted-foreground">A: 為了維護遊戲體驗，請將手機調至靜音，避免在遊戲過程中使用。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 可以錄音錄影嗎？</h4>
                <p className="text-muted-foreground">A: 為保護其他玩家隱私和遊戲體驗，遊戲過程中禁止錄音錄影。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 如果中途想離開怎麼辦？</h4>
                <p className="text-muted-foreground">A: 中途離開會影響其他玩家體驗，如有緊急狀況請告知主持人處理。</p>
              </div>
            </CardContent>
          </Card>

          {/* 場地資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">場地資訊</Badge>
                場地與交通
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 有停車位嗎？</h4>
                <p className="text-muted-foreground">A: 附近有付費停車場，建議搭乘大眾運輸工具。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 怎麼到達玩硬劇本館？</h4>
                <p className="text-muted-foreground">A: 捷運大安站2號出口步行3分鐘，地址：台北市大安區建國南路二段151號3樓。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 場館內有什麼設施？</h4>
                <p className="text-muted-foreground">A: 我們提供舒適的遊戲空間、飲水機、洗手間，以及專業的遊戲道具和音響設備。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 可以帶外食嗎？</h4>
                <p className="text-muted-foreground">A: 場內禁止飲食，但提供飲水。如有特殊需求請事先告知。</p>
              </div>
            </CardContent>
          </Card>

          {/* 費用說明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">費用說明</Badge>
                費用與付款
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 費用如何計算？</h4>
                <p className="text-muted-foreground">A: 費用依劇本和時段而定，下午場NT$680/人，晚間場NT$780/人。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 接受什麼付款方式？</h4>
                <p className="text-muted-foreground">A: 接受現金、信用卡、LINE Pay、街口支付等多種付款方式。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 需要付訂金嗎？</h4>
                <p className="text-muted-foreground">A: 線上預約需支付訂金，現場補足尾款。訂金金額為每人NT$200。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 有團體優惠嗎？</h4>
                <p className="text-muted-foreground">A: 8人以上團體可享9折優惠，學生團體另有特別優惠，請電話詢問。</p>
              </div>
            </CardContent>
          </Card>

          {/* 其他問題 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="secondary">其他</Badge>
                其他常見問題
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 年齡有限制嗎？</h4>
                <p className="text-muted-foreground">A: 建議12歲以上參與，18歲以下參與恐怖類劇本需家長陪同。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 身體不適可以參加嗎？</h4>
                <p className="text-muted-foreground">A: 如有心臟病、高血壓等疾病，請避免參與恐怖類劇本。遊戲中如有不適請立即告知主持人。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 可以指定主持人嗎？</h4>
                <p className="text-muted-foreground">A: 我們會根據劇本特性和時間安排最適合的主持人，如有特殊需求可在預約時備註。</p>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-1">Q: 還有其他問題怎麼辦？</h4>
                <p className="text-muted-foreground">A: 歡迎透過電話、Instagram或現場詢問，我們的工作人員會很樂意為您解答。</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
      
      <SiteFooter 
        title="還有疑問嗎？"
        description="沒找到答案？歡迎直接聯絡我們，或者立即預約體驗！"
        variant="accent"
      />
    </div>
  );
}