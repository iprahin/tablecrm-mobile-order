"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDictionaries } from "@/features/order/hooks/use-dictionaries";
import { useCustomerSearch } from "@/features/order/hooks/use-customer-search";
import { useProductSearch } from "@/features/order/hooks/use-product-search";
import { calculateCartTotal } from "@/features/order/lib/calculate-cart";
import { buildSalePayload } from "@/features/order/lib/build-sale-payload";
import type {
  CartItem,
  Customer,
  DictionaryOption,
  Product,
  RepeatPeriod,
} from "@/features/order/types/order.types";
import { parseMoney } from "../lib/parse-money";

const defaultRepeat = {
  enabled: false,
  period: "hours" as RepeatPeriod,
  value: "5",
  count: "5",
  nextDate: "",
};

function toNumberOrNull(value: string) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function DictionarySelect({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  placeholder: string;
  options: DictionaryOption[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value ? String(value) : ""}
        onValueChange={(nextValue) => onChange(Number(nextValue))}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function MobileOrderPage() {
  const [token, setToken] = useState("");
  const [savedToken, setSavedToken] = useState("");

  const [phone, setPhone] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [payboxId, setPayboxId] = useState<number | null>(null);
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [priceTypeId, setPriceTypeId] = useState<number | null>(null);

  const [productQuery, setProductQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [comment, setComment] = useState("");
  const [repeat, setRepeat] = useState(defaultRepeat);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const dictionariesQuery = useDictionaries(savedToken);
  const customersQuery = useCustomerSearch(savedToken, phone);
  const productsQuery = useProductSearch(savedToken, productQuery, priceTypeId);

  const total = useMemo(() => calculateCartTotal(cart), [cart]);

  const canSubmit =
    Boolean(savedToken) &&
    Boolean(customer) &&
    Boolean(warehouseId) &&
    Boolean(payboxId) &&
    Boolean(organizationId) &&
    cart.length > 0 &&
    !isSubmitting;

  function connectToken() {
    const trimmedToken = token.trim();

    if (!trimmedToken) {
      toast.error("Введите token");
      return;
    }

    setSavedToken(trimmedToken);
    sessionStorage.setItem("tablecrm_token", trimmedToken);
    toast.success("Token сохранён. Загружаю справочники.");
  }

  function addProduct(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...current,
        {
         ...product,
        quantity: 1,
        price: product.price > 0 ? String(product.price) : "",
        },
      ];
    });

    toast.success("Товар добавлен");
  }

  function updateQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current.map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(quantity, 1) }
          : item,
      ),
    );
  }

   function updatePrice(productId: number, price: string) {
  setCart((current) =>
    current.map((item) =>
      item.id === productId ? { ...item, price } : item,
    ),
  );
}

  function removeProduct(productId: number) {
    setCart((current) => current.filter((item) => item.id !== productId));
  }

  async function submitOrder(shouldConduct: boolean) {
    if (!customer || !warehouseId || !payboxId || !organizationId) {
      toast.error("Заполните обязательные поля");
      return;
    }

    if (cart.length === 0) {
        toast.error("Добавьте хотя бы один товар");
        return;
    }

    const hasInvalidPrices = cart.some((item) => parseMoney(item.price) <= 0);

    if (hasInvalidPrices) {
        toast.error("Укажите цену для каждого товара");
        return;
    }


    try {
      setIsSubmitting(true);

      const payload = buildSalePayload({
        cart,
        customer,
        warehouseId,
        payboxId,
        organizationId,
        paidRubles: total,
        shouldConduct,
        repeat,
        comment,
      });

      const response = await fetch("/api/tablecrm/docs-sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tablecrm-token": savedToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.message ?? "Ошибка создания продажи");
      }

      toast.success(
        shouldConduct ? "Продажа создана и проведена" : "Продажа создана",
      );

      setCart([]);
      setComment("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Не удалось создать продажу",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const dictionaries = dictionariesQuery.data;

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-4 pb-36">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4">
        <header className="space-y-1 py-2">
          <h1 className="text-2xl font-bold tracking-tight">
            TableCRM заказ
          </h1>
          <p className="text-sm text-muted-foreground">
            Мобильная форма создания продажи
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>1. Подключение кассы</CardTitle>
            <CardDescription>
              Введите token кассы TableCRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="token">Token</Label>
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="af1874616430..."
              />
            </div>

            <Button className="w-full" onClick={connectToken}>
              Подключиться
            </Button>

            {savedToken ? (
              <Badge variant="secondary">Token подключён</Badge>
            ) : null}
          </CardContent>
        </Card>

        {savedToken ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>2. Клиент</CardTitle>
                <CardDescription>
                  Поиск клиента по телефону
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setCustomer(null);
                    }}
                    placeholder="+7..."
                  />
                </div>

                {customersQuery.isFetching ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Ищу клиента...
                  </div>
                ) : null}

                <div className="space-y-2">
                  {customersQuery.data?.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCustomer(item)}
                      className="w-full rounded-lg border bg-background p-3 text-left text-sm transition hover:bg-muted"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.phone || "Телефон не указан"}
                      </div>
                      {item.loyalityCardId ? (
                        <Badge className="mt-2" variant="secondary">
                          Карта лояльности #{item.loyalityCardId}
                        </Badge>
                      ) : null}
                    </button>
                  ))}
                </div>

                {customer ? (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    Выбран клиент: <strong>{customer.name}</strong>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Параметры продажи</CardTitle>
                <CardDescription>
                  Счёт, организация, склад и тип цены
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dictionariesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загружаю справочники...
                  </div>
                ) : null}

                {dictionariesQuery.isError ? (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    Не удалось загрузить справочники
                  </div>
                ) : null}

                {dictionaries ? (
                  <>
                    <DictionarySelect
                      label="Счёт"
                      value={payboxId}
                      placeholder="Выберите счёт"
                      options={dictionaries.payboxes}
                      onChange={setPayboxId}
                    />

                    <DictionarySelect
                      label="Организация"
                      value={organizationId}
                      placeholder="Выберите организацию"
                      options={dictionaries.organizations}
                      onChange={setOrganizationId}
                    />

                    <DictionarySelect
                      label="Склад"
                      value={warehouseId}
                      placeholder="Выберите склад"
                      options={dictionaries.warehouses}
                      onChange={setWarehouseId}
                    />

                    <DictionarySelect
                      label="Тип цены"
                      value={priceTypeId}
                      placeholder="Выберите тип цены"
                      options={dictionaries.priceTypes}
                      onChange={setPriceTypeId}
                    />
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Товары</CardTitle>
                <CardDescription>
                  Поиск и добавление товаров в корзину
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={productQuery}
                    onChange={(event) => setProductQuery(event.target.value)}
                    placeholder="Название товара"
                  />
                </div>

                {productsQuery.isFetching ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загружаю товары...
                  </div>
                ) : null}

                <div className="space-y-2">
                  {productsQuery.data?.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {product.price.toFixed(2)} ₽
                        </div>
                      </div>

                      <Button
                        size="sm"
                        type="button"
                        onClick={() => addProduct(product)}
                      >
                        Добавить
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Корзина</CardTitle>
                <CardDescription>
                  Количество, скидки и итог
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    <ShoppingCart className="mb-2 h-6 w-6" />
                    Корзина пустая
                  </div>
                ) : null}

                {cart.map((item) => (
                  <div key={item.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {parseMoney(item.price).toFixed(2)} ₽ за шт.
                        </div>
                      </div>

                      <Button
                        size="icon"
                        variant="ghost"
                        type="button"
                        onClick={() => removeProduct(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Количество</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            value={item.quantity}
                            onChange={(event) =>
                              updateQuantity(
                                item.id,
                                toNumberOrNull(event.target.value) ?? 1,
                              )
                            }
                            className="text-center"
                          />

                          <Button
                            size="icon"
                            variant="outline"
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Цена, ₽</Label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            value={item.price}
                            onChange={(event) => {
                                const value = event.target.value;

                                if (/^\d*([.,]\d{0,2})?$/.test(value)) {
                                updatePrice(item.id, value);
                                }
                            }}
                            placeholder="0.00"
                            />
                        </div>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="flex items-center justify-between font-semibold">
                  <span>Итого</span>
                  <span>{total.toFixed(2)} ₽</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Повтор заказа</CardTitle>
                <CardDescription>
                  Опциональные настройки повторяемости
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Включить повтор</Label>
                  <Switch
                    checked={repeat.enabled}
                    onCheckedChange={(checked) =>
                      setRepeat((current) => ({
                        ...current,
                        enabled: checked,
                      }))
                    }
                  />
                </div>

                {repeat.enabled ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Период</Label>
                      <Select
                        value={repeat.period}
                        onValueChange={(value) =>
                          setRepeat((current) => ({
                            ...current,
                            period: value as RepeatPeriod,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Часы</SelectItem>
                          <SelectItem value="days">Дни</SelectItem>
                          <SelectItem value="weeks">Недели</SelectItem>
                          <SelectItem value="months">Месяцы</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Значение</Label>
                        <Input
                          value={repeat.value}
                          onChange={(event) =>
                            setRepeat((current) => ({
                              ...current,
                              value: event.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Кол-во повторов</Label>
                        <Input
                          value={repeat.count}
                          onChange={(event) =>
                            setRepeat((current) => ({
                              ...current,
                              count: event.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Дата следующего создания</Label>
                      <Input
                        type="datetime-local"
                        value={repeat.nextDate}
                        onChange={(event) =>
                          setRepeat((current) => ({
                            ...current,
                            nextDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Комментарий</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Комментарий к заказу"
                />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {savedToken ? (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-4 backdrop-blur">
          <div className="mx-auto flex max-w-md flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">К оплате</span>
              <strong className="text-xl">{total.toFixed(2)} ₽</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                disabled={!canSubmit}
                onClick={() => submitOrder(false)}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Создать"
                )}
              </Button>

              <Button disabled={!canSubmit} onClick={() => submitOrder(true)}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Создать и провести"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}