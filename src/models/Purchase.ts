import UserItem from "./UserItem";

export interface Purchase {
  items: UserItem[];
  cost: number;
}
